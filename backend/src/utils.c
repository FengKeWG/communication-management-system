#include "utils.h"

int min3(int a, int b, int c)
{
    int v = a;
    if (b < v)
        v = b;
    if (c < v)
        v = c;
    return v;
}

void hashPassword(const char *password, char *hash_out)
{
    unsigned long hash = 5381;
    int c;
    while ((c = *password++))
    {
        hash = ((hash << 5) + hash) + c;
    }
    snprintf(hash_out, 65, "%lx", hash);
}

int uidGenerate()
{
    static unsigned int counter = 0;
    static time_t lastTime = 0;
    time_t currentTime = time(NULL);
    if (currentTime != lastTime)
    {
        srand((unsigned int)currentTime);
        counter = 0;
        lastTime = currentTime;
    }
    else
    {
        counter = (counter + 1) % 100;
    }
    int leading = (rand() % 9) + 1;
    int timePart = currentTime % 100000;
    int counterPart = counter;
    int uid = leading * 1000000 + timePart * 100 + counterPart;
    if (uid < 10000000)
        uid += 10000000;
    return uid;
}

void getNext(const char *p, int n, int *ne)
{
    ne[0] = -1;
    for (int i = 1, j = -1; i < n; i++)
    {
        while (j != -1 && p[i] != p[j + 1])
            j = ne[j];
        if (p[i] == p[j + 1])
            j++;
        ne[i] = j;
    }
}

int kmp(const char *s, const char *p)
{
    int m = strlen(s);
    int n = strlen(p);
    int ne[n];
    getNext(p, n, ne);
    for (int i = 0, j = -1; i < m; i++)
    {
        while (j != -1 && s[i] != p[j + 1])
            j = ne[j];
        if (s[i] == p[j + 1])
            j++;
        if (j == n - 1)
            return i - n + 1;
    }
    return -1;
}

void toLower(char *s)
{
    if (s == NULL)
        return;
    setlocale(LC_CTYPE, "");
    for (int i = 0; s[i]; i++)
        if (isalpha((unsigned char)s[i]))
            s[i] = tolower((unsigned char)s[i]);
}

int stoi(char *str)
{
    if (str == NULL || str[0] == '\0')
        return 0;
    int sign = 1;
    int res = 0;
    int i = 0;
    while (isspace(str[i]))
    {
        i++;
    }
    if (str[i] == '+' || str[i] == '-')
    {
        sign = (str[i] == '-') ? -1 : 1;
        i++;
    }
    while (isdigit(str[i]))
    {
        int digit = str[i] - '0';
        if (res > INT_MAX / 10 || (res == INT_MAX / 10 && digit > INT_MAX % 10))
        {
            return 0;
        }
        if (res < INT_MIN / 10 || (res == INT_MIN / 10 && -digit < INT_MIN % 10))
        {
            return 0;
        }
        res = res * 10 + sign * digit;
        i++;
    }
    if (str[i] != '\0')
    {
        return 0;
    }
    return res;
}

char *scpy(char *dest, const char *src, size_t dest_size)
{
    if (!dest || dest_size == 0)
        return dest;
    if (src)
    {
        strncpy(dest, src, dest_size - 1);
    }
    else
    {
        dest[0] = '\0';
        return dest;
    }
    dest[dest_size - 1] = '\0';
    return dest;
}

bool isEmailValid(const char *email)
{
    if (!email || *email == '\0')
        return 0;
    int len = strlen(email);
    if (len > 80)
        return 0;
    int at_index = -1;
    int dot_after_at = 0;
    for (int i = 0; i < len; ++i)
    {
        char c = email[i];
        if (!(isalnum((unsigned char)c) || c == '.' || c == '_' || c == '-' || c == '@') || isspace((unsigned char)c))
        {
            return 0;
        }
        if (c == '@')
        {
            if (at_index != -1)
                return 0;
            at_index = i;
        }
        else if (c == '.')
        {
            if (at_index != -1)
                dot_after_at = 1;
            if (i > 0 && email[i - 1] == '.')
                return 0;
        }
    }
    if (at_index == -1 || at_index == 0 || at_index == len - 1)
        return 0;
    if (!dot_after_at || email[len - 1] == '.')
        return 0;
    if (email[at_index + 1] == '.')
        return 0;
    if (email[0] == '.' || email[at_index - 1] == '.')
        return 0;
    char email_copy[len + 1];
    strcpy(email_copy, email);
    email_copy[len] = '\0';
    char *domain_part_copy = email_copy + at_index + 1;
    char *token = strtok(domain_part_copy, ".");
    if (!token)
        return 0;
    do
    {
        int token_len = strlen(token);
        if (token_len == 0 || token[0] == '-' || token[token_len - 1] == '-')
            return 0;
        for (int i = 0; i < token_len; ++i)
        {
            if (!(isalnum((unsigned char)token[i]) || token[i] == '-'))
                return 0;
        }
    } while ((token = strtok(NULL, ".")) != NULL);
    return 1;
}

bool isPhoneNumberValid(const char *phone_number)
{
    if (phone_number == NULL || *phone_number == '\0')
    {
        return 0;
    }
    int len = strlen(phone_number);
    if (len < 7 || len > 15)
    {
        return 0;
    }
    int digit_count = 0;
    int hyphen_count = 0;
    for (int i = 0; i < len; i++)
    {
        if (isdigit(phone_number[i]))
        {
            digit_count++;
        }
        else if (phone_number[i] == '-')
        {
            hyphen_count++;
        }
        else
        {
            return 0;
        }
    }
    if (digit_count < 7)
    {
        return 0;
    }
    if (digit_count >= 11 && phone_number[0] == '1' && hyphen_count == 0)
    {
        return 1;
    }
    else if (hyphen_count <= 1)
    {
        return 1;
    }
    return 0;
}

bool isBirthDayValid(const char *year_str, const char *month_str, const char *day_str)
{
    if (year_str == NULL || month_str == NULL || day_str == NULL)
    {
        return 0;
    }
    int year = stoi((char *)year_str);
    int month = stoi((char *)month_str);
    int day = stoi((char *)day_str);
    if (year == 0 || month == 0 || day == 0)
    {
        return 0;
    }
    if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31)
    {
        return 0;
    }
    time_t t = time(NULL);
    struct tm tm = *localtime(&t);
    int current_year = tm.tm_year + 1900;
    int current_month = tm.tm_mon + 1;
    int current_day = tm.tm_mday;
    if (year > current_year)
    {
        return 0;
    }
    if (year == current_year && month > current_month)
    {
        return 0;
    }
    if (year == current_year && month == current_month && day > current_day)
    {
        return 0;
    }
    int days_in_month[] = {0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0)
    {
        days_in_month[2] = 29;
    }
    if (day > days_in_month[month])
    {
        return 0;
    }
    return 1;
}

bool isPositiveNumberValid(const char *number_str)
{
    if (number_str == NULL || *number_str == '\0')
    {
        return 0;
    }
    int len = strlen(number_str);
    if (len < 1 || len > 20)
    {
        return 0;
    }
    for (int i = 0; i < len; i++)
    {
        if (!isdigit(number_str[i]))
        {
            return 0;
        }
    }
    return 1;
}

bool isPasswordValid(const char *password)
{
    if (password == NULL || *password == '\0')
    {
        return 0;
    }
    int len = strlen(password);
    if (len < 8 || len > 20)
    {
        return 0;
    }
    int has_letter = 0;
    int has_digit = 0;
    for (int i = 0; i < len; i++)
    {
        if (isalpha(password[i]))
        {
            has_letter = 1;
        }
        else if (isdigit(password[i]))
        {
            has_digit = 1;
        }
        else
        {
            return 0;
        }
    }
    if (!has_letter || !has_digit)
    {
        return 0;
    }
    return 1;
}

bool isTimeValid(const char *year_str, const char *month_str, const char *day_str, const char *hour_str, const char *minute_str, const char *second_str)
{
    int year, month, day, hour, minute, second;
    if (year_str == NULL || month_str == NULL || day_str == NULL ||
        hour_str == NULL || minute_str == NULL || second_str == NULL)
    {
        return 0;
    }
    if (strlen(year_str) == 0 || strlen(month_str) == 0 || strlen(day_str) == 0 ||
        strlen(hour_str) == 0 || strlen(minute_str) == 0 || strlen(second_str) == 0)
    {
        return 0;
    }
    year = stoi((char *)year_str);
    month = stoi((char *)month_str);
    day = stoi((char *)day_str);
    hour = stoi((char *)hour_str);
    minute = stoi((char *)minute_str);
    second = stoi((char *)second_str);
    if (year == 0 || month == 0 || day == 0)
        return 0;
    if (hour_str[0] != '0' && hour == 0 && strlen(hour_str) > 0)
        return 0;
    if (minute_str[0] != '0' && minute == 0 && strlen(minute_str) > 0)
        return 0;
    if (second_str[0] != '0' && second == 0 && strlen(second_str) > 0)
        return 0;
    if (year < 1 || year > 9999)
        return 0;
    if (month < 1 || month > 12)
        return 0;
    if (hour < 0 || hour > 23)
        return 0;
    if (minute < 0 || minute > 59)
        return 0;
    if (second < 0 || second > 59)
        return 0;
    int days_in_month[] = {0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    if ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0))
    {
        days_in_month[2] = 29;
    }
    if (day < 1 || day > days_in_month[month])
        return 0;
    return 1;
}

bool isGenderValid(const char *str)
{
    if (str == NULL)
    {
        return 0;
    }
    if (strcmp(str, "男") == 0)
    {
        return 1;
    }
    else if (strcmp(str, "女") == 0)
    {
        return 1;
    }
    else if (strcmp(str, "未知") == 0)
    {
        return 1;
    }
    else
    {
        return 0;
    }
}