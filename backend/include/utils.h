#ifndef UTILS_H
#define UTILS_H
#include <stdio.h>
#include <string.h>
#include <time.h>
#include <stdlib.h>
#include <ctype.h>
#include <locale.h>

#define debug 0

static inline int min(int a, int b, int c)
{
    int min_val = a;
    if (b < min_val)
    {
        min_val = b;
    }
    if (c < min_val)
    {
        min_val = c;
    }
    return min_val;
}

void hashPassword(const char *password, char *hash_out);
int uidGenerate();
void next(const char *s, int n, int *ne);
int kmp(char *t, const char *s);
void toLower(char *s);
int stoi(char *str);
char *scpy(char *dest, const char *src, size_t dest_size);

#endif