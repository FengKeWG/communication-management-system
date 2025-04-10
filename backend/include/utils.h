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
bool isPhoneNumberValid(const char *phone_number);
bool isEmailValid(const char *email);
bool isBirthDayValid(const char *year_str, const char *month_str, const char *day_str);
bool isStrValid(const char *str);
bool isPositiveNumberValid(const char *number_str);
bool isPasswordValid(const char *password);
bool isTimeValid(const char *year_str, const char *month_str, const char *day_str, const char *hour_str, const char *minute_str, const char *second_str);
bool isGenderValid(const char *str);
#endif