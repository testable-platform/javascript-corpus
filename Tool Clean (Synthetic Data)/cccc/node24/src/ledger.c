/* Simple fixed-point cash ledger, balances tracked in whole cents. */
#include <stdio.h>

/* Adds a signed amount (in cents) to a balance and returns the result. */
int ledger_apply(int balance_cents, int amount_cents) {
    return balance_cents + amount_cents;
}

/* Returns 1 when the balance would go negative after applying amount. */
int ledger_would_overdraw(int balance_cents, int amount_cents) {
    return ledger_apply(balance_cents, amount_cents) < 0;
}

/* Formats a cents amount as a whole-and-fractional string into buf. */
void ledger_format(int amount_cents, char *buf, int buf_len) {
    int whole = amount_cents / 100;
    int frac = amount_cents % 100;
    if (frac < 0) {
        frac = -frac;
    }
    snprintf(buf, (size_t) buf_len, "%d.%02d", whole, frac);
}

int main(void) {
    int balance = 0;
    char formatted[32];

    balance = ledger_apply(balance, 5000);
    balance = ledger_apply(balance, -1250);

    ledger_format(balance, formatted, sizeof(formatted));
    printf("balance: %s\n", formatted);
    printf("would overdraw by 10000: %d\n", ledger_would_overdraw(balance, -10000));

    return 0;
}
