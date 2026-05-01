package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"strconv"
	"strings"
	"time"
)

const tokenTTL = 30 * 24 * time.Hour

type TokenSigner struct {
	secret []byte
}

func NewTokenSigner(secret string) *TokenSigner {
	if len(secret) < 16 {
		return nil
	}
	return &TokenSigner{secret: []byte(secret)}
}

func (s *TokenSigner) Issue(userID string) string {
	exp := time.Now().Add(tokenTTL).Unix()
	payload := userID + "." + strconv.FormatInt(exp, 10)
	mac := s.sign(payload)
	return base64.RawURLEncoding.EncodeToString([]byte(payload)) + "." + mac
}

func (s *TokenSigner) Verify(token string) (string, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return "", errors.New("malformed token")
	}
	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", errors.New("malformed token")
	}
	expected := s.sign(string(payloadBytes))
	if !hmac.Equal([]byte(expected), []byte(parts[1])) {
		return "", errors.New("invalid signature")
	}

	dot := strings.LastIndex(string(payloadBytes), ".")
	if dot <= 0 {
		return "", errors.New("malformed payload")
	}
	userID := string(payloadBytes)[:dot]
	expStr := string(payloadBytes)[dot+1:]
	exp, err := strconv.ParseInt(expStr, 10, 64)
	if err != nil {
		return "", errors.New("malformed expiry")
	}
	if time.Now().Unix() > exp {
		return "", errors.New("token expired")
	}
	if !validUUID(userID) {
		return "", errors.New("invalid user id")
	}
	return userID, nil
}

func (s *TokenSigner) sign(payload string) string {
	mac := hmac.New(sha256.New, s.secret)
	mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
