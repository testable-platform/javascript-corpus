/* Freight surcharge ledger, balances tracked in whole cents. Deliberately
 * tangled control flow for the cccc Invalid fixture (majority-wrong by
 * McCabe cyclomatic complexity). */
#include <stdio.h>

/* Highly branchy surcharge classifier -- CCN far above threshold. */
int classify_surcharge_cents(int weight_kg, int distance_km, int fragile,
                              int hazardous, int refrigerated, int oversize) {
    int surcharge = 0;
    if (weight_kg > 1000) {
        surcharge += 500;
    } else if (weight_kg > 800) {
        surcharge += 400;
    } else if (weight_kg > 600) {
        surcharge += 300;
    } else if (weight_kg > 400) {
        surcharge += 200;
    } else if (weight_kg > 200) {
        surcharge += 100;
    } else {
        surcharge += 50;
    }
    if (distance_km > 2000) {
        surcharge += 600;
    } else if (distance_km > 1000) {
        surcharge += 400;
    } else if (distance_km > 500) {
        surcharge += 200;
    } else {
        surcharge += 50;
    }
    if (fragile) {
        surcharge += 150;
    }
    if (hazardous) {
        surcharge += 700;
    }
    if (refrigerated) {
        surcharge += 250;
    }
    if (oversize) {
        surcharge += 300;
    }
    if (fragile && hazardous) {
        surcharge += 100;
    }
    if (hazardous && refrigerated) {
        surcharge += 120;
    }
    return surcharge;
}

/* Tiered weight classifier with a dense switch -- also CCN-heavy. */
int weight_tier_code(int weight_kg) {
    int tier;
    switch (weight_kg / 100) {
        case 0: tier = 1; break;
        case 1: tier = 2; break;
        case 2: tier = 3; break;
        case 3: tier = 4; break;
        case 4: tier = 5; break;
        case 5: tier = 6; break;
        case 6: tier = 7; break;
        case 7: tier = 8; break;
        case 8: tier = 9; break;
        case 9: tier = 10; break;
        case 10: tier = 11; break;
        default: tier = 12; break;
    }
    return tier;
}

/* Simple, low-complexity helper -- kept under threshold. */
int ledger_apply(int balance_cents, int amount_cents) {
    return balance_cents + amount_cents;
}

int main(void) {
    int total = classify_surcharge_cents(900, 1500, 1, 0, 1, 0);
    int tier = weight_tier_code(650);
    int balance = ledger_apply(0, total);
    printf("surcharge: %d, tier: %d, balance: %d\n", total, tier, balance);
    return 0;
}
