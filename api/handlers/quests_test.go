package handlers

import (
	"testing"
	"time"
)

func TestWeekStart(t *testing.T) {
	mustParse := func(s string) time.Time {
		v, err := time.Parse(time.RFC3339, s)
		if err != nil {
			t.Fatalf("bad time %q: %v", s, err)
		}
		return v
	}

	cases := []struct {
		name string
		in   string
		want string
	}{
		{"понедельник ровно в полночь", "2026-08-17T00:00:00Z", "2026-08-17T00:00:00Z"},
		{"понедельник днём", "2026-08-17T13:45:00Z", "2026-08-17T00:00:00Z"},
		{"среда", "2026-08-19T09:00:00Z", "2026-08-17T00:00:00Z"},
		{"воскресенье вечером", "2026-08-23T23:59:59Z", "2026-08-17T00:00:00Z"},
		{"следующий понедельник", "2026-08-24T00:00:01Z", "2026-08-24T00:00:00Z"},
		{"переход через месяц", "2026-09-02T10:00:00Z", "2026-08-31T00:00:00Z"},
		// Не-UTC вход должен нормализоваться: 01:30 +03:00 — это ещё воскресенье UTC.
		{"смещённая зона", "2026-08-24T01:30:00+03:00", "2026-08-17T00:00:00Z"},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := weekStart(mustParse(c.in))
			want := mustParse(c.want)
			if !got.Equal(want) {
				t.Errorf("weekStart(%s) = %s, ожидалось %s", c.in, got.Format(time.RFC3339), c.want)
			}
			if got.Weekday() != time.Monday {
				t.Errorf("начало недели должно быть понедельником, получено %s", got.Weekday())
			}
		})
	}
}
