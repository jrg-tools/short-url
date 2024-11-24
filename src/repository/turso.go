package repository

import (
	"database/sql"
	"fmt"
	"time"

	// import the turso driver
	_ "github.com/tursodatabase/libsql-client-go/libsql"
)

const (
	tursoDriver    = "libsql"
	maxOpenConns   = 25
	maxIdleConns   = 25
	defaultTimeout = 5 * time.Minute
)

// ConnectTurso connects to a SQLite database.
func ConnectTurso(dbUrl, token string) (*sql.DB, error) {
	url := fmt.Sprintf("%s?authToken=%s", dbUrl, token)

	db, err := sql.Open(tursoDriver, url)
	if err != nil {
		return nil, err
	}

	db.SetMaxIdleConns(maxIdleConns)
	db.SetMaxOpenConns(maxOpenConns)
	db.SetConnMaxIdleTime(defaultTimeout)

	return db, nil
}
