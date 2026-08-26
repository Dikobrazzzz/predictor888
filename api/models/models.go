package models

import "time"

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Login     string    `json:"login"`
	Region    string    `json:"region"`
	Points    int       `json:"points"`
	Tokens    int       `json:"tokens"`
	CreatedAt time.Time `json:"created_at"`
}

type Prediction struct {
	ID        string     `json:"id"`
	UserID    string     `json:"user_id"`
	EventID   string     `json:"event_id"`
	Sport     string     `json:"sport"`
	League    string     `json:"league"`
	HomeTeam  string     `json:"home_team"`
	AwayTeam  string     `json:"away_team"`
	Outcome   string     `json:"outcome"`
	Points    int        `json:"points"`
	Status    string     `json:"status"`
	StartsAt  *time.Time `json:"starts_at"`
	CreatedAt time.Time  `json:"created_at"`
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
	Token string `json:"token,omitempty"`
	Error string `json:"error,omitempty"`
}

type PredictionRequest struct {
	EventID  string     `json:"event_id"`
	Sport    string     `json:"sport"`
	League   string     `json:"league"`
	HomeTeam string     `json:"home_team"`
	AwayTeam string     `json:"away_team"`
	Outcome  string     `json:"outcome"`
	StartsAt *time.Time `json:"starts_at"`
}

// ── Квесты ────────────────────────────────────────────────────────────────

type Quest struct {
	ID          string `json:"id"`
	Code        string `json:"code"`
	Metric      string `json:"metric"`
	Target      int    `json:"target"`
	Progress    int    `json:"progress"`
	Completed   bool   `json:"completed"`
	RewardKind  string `json:"reward_kind"`
	RewardValue int    `json:"reward_value"`
}

type QuestsResponse struct {
	Quests        []Quest   `json:"quests"`
	Done          int       `json:"done"`
	Total         int       `json:"total"`
	PeriodStart   time.Time `json:"period_start"`
	PeriodEnd     time.Time `json:"period_end"`
	RewardClaimed bool      `json:"reward_claimed"`
}

// ── Промокоды ─────────────────────────────────────────────────────────────

type Promo struct {
	ID         string `json:"id"`
	Code       string `json:"code,omitempty"`
	Game       string `json:"game"`
	RewardText string `json:"reward_text"`
	Claimed    bool   `json:"claimed"`
}

type PromosResponse struct {
	Promos []Promo `json:"promos"`
	New    int     `json:"new"`
}

// ── Top Picks ─────────────────────────────────────────────────────────────

type Analyst struct {
	Name      string `json:"name"`
	Role      string `json:"role"`
	Avatar    string `json:"avatar"`
	Accuracy  int    `json:"accuracy"`
	Instagram string `json:"instagram"`
}

type TopPick struct {
	ID       string     `json:"id"`
	League   string     `json:"league"`
	HomeTeam string     `json:"home_team"`
	AwayTeam string     `json:"away_team"`
	Comment  string     `json:"comment"`
	Outcome  string     `json:"outcome"`
	Odds     float64    `json:"odds"`
	StartsAt *time.Time `json:"starts_at"`
	Featured bool       `json:"featured"`
	Analyst  Analyst    `json:"analyst"`
}
