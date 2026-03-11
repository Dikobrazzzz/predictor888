package handlers

import (
	"encoding/json"
	"net/http"
	"regexp"
)

var loginRe = regexp.MustCompile(`^[a-zA-Z0-9_]{2,30}$`)

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func validLogin(s string) bool {
	return loginRe.MatchString(s)
}

func validStringField(s string, max int) bool {
	return len(s) > 0 && len(s) <= max
}
