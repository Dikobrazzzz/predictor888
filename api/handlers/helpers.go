package handlers

import (
	"encoding/json"
	"net/http"
	"regexp"
)

var (
	loginRe = regexp.MustCompile(`^[a-zA-Z0-9_]{2,30}$`)
	uuidRe  = regexp.MustCompile(`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)
)

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func validUUID(s string) bool {
	return uuidRe.MatchString(s)
}

func validLogin(s string) bool {
	return loginRe.MatchString(s)
}

func validStringField(s string, max int) bool {
	return len(s) > 0 && len(s) <= max
}

func validOptionalField(s string, max int) bool {
	return len(s) <= max
}
