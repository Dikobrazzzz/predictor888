package handlers

import (
	"testing"
	"time"
)

func day(s string) time.Time {
	v, err := time.Parse("2006-01-02", s)
	if err != nil {
		panic(err)
	}
	return v.UTC()
}

func TestStreakFromDates(t *testing.T) {
	now := day("2026-08-18").Add(15 * time.Hour) // вторник, день в разгаре

	cases := []struct {
		name  string
		dates []time.Time
		want  int
	}{
		{"нет визитов", nil, 0},
		{"только сегодня", []time.Time{day("2026-08-18")}, 1},
		{"сегодня и вчера", []time.Time{day("2026-08-18"), day("2026-08-17")}, 2},
		{"пять дней подряд", []time.Time{
			day("2026-08-18"), day("2026-08-17"), day("2026-08-16"),
			day("2026-08-15"), day("2026-08-14"),
		}, 5},
		{"серия прервана", []time.Time{
			day("2026-08-18"), day("2026-08-17"), day("2026-08-15"),
		}, 2},
		{"сегодня не заходил, серия со вчера", []time.Time{
			day("2026-08-17"), day("2026-08-16"),
		}, 2},
		{"последний визит позавчера — серия оборвана", []time.Time{
			day("2026-08-16"), day("2026-08-15"),
		}, 0},
		{"дубли одной даты не удваивают серию", []time.Time{
			day("2026-08-18"), day("2026-08-18"), day("2026-08-17"),
		}, 2},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := streakFromDates(c.dates, now); got != c.want {
				t.Errorf("streakFromDates = %d, ожидалось %d", got, c.want)
			}
		})
	}
}
