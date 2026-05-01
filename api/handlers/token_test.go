package handlers

import (
	"encoding/base64"
	"testing"
)

const testSecret = "0123456789abcdef0123456789abcdef"
const testUID = "11111111-2222-3333-4444-555555555555"

func TestTokenRoundTrip(t *testing.T) {
	s := NewTokenSigner(testSecret)
	tok := s.Issue(testUID)
	got, err := s.Verify(tok)
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if got != testUID {
		t.Fatalf("uid mismatch: got %q want %q", got, testUID)
	}
}

func TestTokenSignerNilOnShortSecret(t *testing.T) {
	if NewTokenSigner("short") != nil {
		t.Fatal("expected nil for short secret")
	}
}

func TestTokenInvalidSignature(t *testing.T) {
	s := NewTokenSigner(testSecret)
	tok := s.Issue(testUID)
	tampered := tok[:len(tok)-1] + "x"
	if _, err := s.Verify(tampered); err == nil {
		t.Fatal("expected error for tampered token")
	}
}

func TestTokenExpired(t *testing.T) {
	s := NewTokenSigner(testSecret)
	expiredPayload := testUID + "." + "1"
	expiredTok := base64.RawURLEncoding.EncodeToString([]byte(expiredPayload)) + "." + s.sign(expiredPayload)
	if _, err := s.Verify(expiredTok); err == nil {
		t.Fatal("expected expired error")
	}
}

func TestTokenInvalidUUID(t *testing.T) {
	s := NewTokenSigner(testSecret)
	payload := "not-a-uuid.9999999999"
	tok := base64.RawURLEncoding.EncodeToString([]byte(payload)) + "." + s.sign(payload)
	if _, err := s.Verify(tok); err == nil {
		t.Fatal("expected invalid uuid error")
	}
}
