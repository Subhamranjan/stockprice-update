CREATE TABLE IF NOT EXISTS watchlist (
    id        SERIAL PRIMARY KEY,
    symbol    VARCHAR(30)  NOT NULL,
    market    VARCHAR(20)  NOT NULL DEFAULT 'NSE',
    target    NUMERIC      DEFAULT 0,
    stop_loss NUMERIC      DEFAULT 0,
    buy_price NUMERIC      DEFAULT 0,
    qty       INTEGER      DEFAULT 1,
    side      VARCHAR(10)  DEFAULT 'buy',
    mode      VARCHAR(10)  DEFAULT 'trade',
    entry_date DATE,
    notes     TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
