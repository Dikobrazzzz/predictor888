package models

import "time"

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Login     string    `json:"login"`
	Region    string    `json:"region"`
	Points    int       `json:"points"`
	CreatedAt time.Time `json:"created_at"`
}

type Prediction struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	EventID   string    `json:"event_id"`
	Sport     string    `json:"sport"`
	League    string    `json:"league"`
	HomeTeam  string    `json:"home_team"`
	AwayTeam  string    `json:"away_team"`
	Outcome   string    `json:"outcome"`
	Points    int       `json:"points"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type LeaderboardEntry struct {
	UserID      string    `json:"user_id"`
	Login       string    `json:"login"`
	TotalPoints int       `json:"total_points"`
	Wins        int       `json:"wins"`
	Losses      int       `json:"losses"`
	Rank        int       `json:"rank"`
	Period      string    `json:"period"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Coef struct {
	Home *float64 `json:"home"`
	Draw *float64 `json:"draw"`
	Away *float64 `json:"away"`
}

type Match struct {
	ID       interface{} `json:"id"`
	League   string      `json:"league"`
	Sport    string      `json:"sport"`
	Status   string      `json:"status"`
	TimeLeft interface{} `json:"timeLeft"`
	Home     string      `json:"home"`
	Away     string      `json:"away"`
	HomeIcon *string     `json:"homeIcon"`
	AwayIcon *string     `json:"awayIcon"`
	Score    *string     `json:"score"`
	Coef     Coef        `json:"coef"`
}

type LoginRequest struct {
	Email string `json:"email"`
}

type LoginResponse struct {
	User  *User  `json:"user,omitempty"`
	Error string `json:"error,omitempty"`
}

type PredictionRequest struct {
	EventID  string `json:"event_id"`
	Sport    string `json:"sport"`
	League   string `json:"league"`
	HomeTeam string `json:"home_team"`
	AwayTeam string `json:"away_team"`
	Outcome  string `json:"outcome"`
}
