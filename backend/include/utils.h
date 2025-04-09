#ifndef UTILS_H
#define UTILS_H
#include <stdio.h>
#include <string.h>
#include <time.h>
#include <stdlib.h>
#include <ctype.h>
#include <locale.h>

int min3(int a, int b, int c);
void hashPassword(const char *password, char *hash_out);
int uidGenerate();
void getNext(const char *s, int n, int *ne);
int kmp(const char *s, const char *p);
void toLower(char *s);
int stoi(char *str);
char *scpy(char *dest, const char *src, size_t dest_size);
int isPhoneNumberValid(const char *phone_number);
int isEmailValid(const char *email);
int isBirthDayValid(const char *year_str, const char *month_str, const char *day_str);
int isStrValid(const char *str);
int isPositiveNumberValid(const char *number_str);
int isPasswordValid(const char *password);
int isTimeValid(const char *year_str, const char *month_str, const char *day_str,
                const char *hour_str, const char *minute_str, const char *second_str);
int judgeGender(const char *str);
#endif