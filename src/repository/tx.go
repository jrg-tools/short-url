package repository

import (
	"context"
	"database/sql"
	"time"
)

// Transaction is the interface that wraps the basic transaction methods.
type Transaction interface {
	// ReadWriteTransaction executes f.
	ReadWriteTransaction(ctx context.Context, f func(ctx context.Context, tx *sql.Tx) error) (time.Time, error)
	// ReadOnlyTransaction executes f with an empty sql.Tx.
	ReadOnlyTransaction(ctx context.Context, f func(ctx context.Context, tx *sql.Tx) error) (time.Time, error)
}

type transaction struct {
	DB *sql.DB
}

// NewTransaction returns a new Transaction.
func NewTransaction(db *sql.DB) Transaction {
	return &transaction{
		DB: db,
	}
}

// ReadWriteTransaction callback to encapsulate a transaction with read-write access.
func (t *transaction) ReadWriteTransaction(ctx context.Context, f func(ctx context.Context, tx *sql.Tx) error) (time.Time, error) {
	tx, err := t.DB.BeginTx(ctx, nil)
	if err != nil {
		return time.Time{}, err
	}
	defer run(tx)
	err = f(ctx, tx)
	return time.Time{}, err
}

// ReadOnlyTransaction callback to encapsulate a transaction with read-only access.
func (t *transaction) ReadOnlyTransaction(ctx context.Context, f func(ctx context.Context, tx *sql.Tx) error) (time.Time, error) {
	txOptions := &sql.TxOptions{
		ReadOnly: true,
	}

	tx, err := t.DB.BeginTx(ctx, txOptions)
	if err != nil {
		return time.Time{}, err
	}
	defer run(tx)
	err = f(ctx, tx)
	return time.Time{}, err
}

func run(tx *sql.Tx) {
	if p := recover(); p != nil {
		_ = tx.Rollback()
	} else {
		_ = tx.Commit()
	}
}
