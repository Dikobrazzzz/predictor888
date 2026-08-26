-- Стартовое наполнение Top Picks. Матчи здесь — заглушка контент-менеджера:
-- дальше карточки заводятся руками через админку/SQL, поэтому вставка
-- идемпотентная и не трогает уже существующие записи.

INSERT INTO analysts (id, name, role, avatar_url, accuracy, instagram)
VALUES (
    '00000000-0000-0000-0000-0000000000a1',
    'Kate', 'Sport Analyst', '/icons/kate.webp', 78, 'https://instagram.com/'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO top_picks (id, analyst_id, league, home_team, away_team, comment, outcome, odds, starts_at, featured)
VALUES
    ('00000000-0000-0000-0000-0000000000b1',
     '00000000-0000-0000-0000-0000000000a1',
     'Premier League', 'Newcastle', 'Man City',
     'Newcastle have won four home games in a row and City are missing two defenders. Value is on the hosts.',
     'home', 3.60, now() + interval '4 hours', TRUE),

    ('00000000-0000-0000-0000-0000000000b2',
     '00000000-0000-0000-0000-0000000000a1',
     'La Liga', 'Sevilla', 'Villarreal',
     'Sevilla keep drawing at home and Villarreal travel without their top scorer. The draw looks underpriced.',
     'draw', 3.20, now() + interval '6 hours', FALSE),

    ('00000000-0000-0000-0000-0000000000b3',
     '00000000-0000-0000-0000-0000000000a1',
     'Serie A', 'Lazio', 'Bologna',
     'Bologna are unbeaten in five away matches while Lazio have lost three of their last four at home.',
     'away', 2.80, now() + interval '8 hours', FALSE)
ON CONFLICT (id) DO NOTHING;
