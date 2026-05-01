package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sort"

	"github.com/jackc/pgx/v5/pgxpool"
)

const migrationsDir = "migrations"

func runMigrations(pool *pgxpool.Pool) {
	ctx := context.Background()

	if _, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version    TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)`); err != nil {
		slog.Error("migrations: cannot create schema_migrations", "err", err)
		os.Exit(1)
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		slog.Warn("migrations: directory not found", "err", err)
		return
	}

	files := make([]string, 0, len(entries))
	for _, e := range entries {
		if !e.IsDir() && filepath.Ext(e.Name()) == ".sql" {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	applied, err := loadAppliedVersions(ctx, pool)
	if err != nil {
		slog.Error("migrations: cannot load applied versions", "err", err)
		os.Exit(1)
	}

	for _, name := range files {
		version := name
		if applied[version] {
			continue
		}

		path := filepath.Join(migrationsDir, name)
		sql, err := os.ReadFile(path)
		if err != nil {
			slog.Error("migrations: cannot read file", "file", name, "err", err)
			os.Exit(1)
		}

		if err := applyMigration(ctx, pool, version, string(sql)); err != nil {
			slog.Error("migrations: apply failed", "file", name, "err", err)
			os.Exit(1)
		}
		slog.Info("migration applied", "version", version)
	}
}

func loadAppliedVersions(ctx context.Context, pool *pgxpool.Pool) (map[string]bool, error) {
	rows, err := pool.Query(ctx, `SELECT version FROM schema_migrations`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := map[string]bool{}
	for rows.Next() {
		var v string
		if err := rows.Scan(&v); err != nil {
			return nil, err
		}
		out[v] = true
	}
	return out, rows.Err()
}

func applyMigration(ctx context.Context, pool *pgxpool.Pool, version, sql string) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, sql); err != nil {
		return fmt.Errorf("exec: %w", err)
	}
	if _, err := tx.Exec(ctx, `INSERT INTO schema_migrations (version) VALUES ($1)`, version); err != nil {
		return fmt.Errorf("record: %w", err)
	}
	return tx.Commit(ctx)
}
