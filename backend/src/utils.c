#include "utils.h"

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

void next(char *s, int n, int *ne)
{
    int len = 0;
    ne[0] = 0;
    int i = 1;
    while (i < n)
    {
        if (s[i] == s[len])
        {
            len++;
            ne[i] = len;
            i++;
        }
        else
        {
            if (len != 0)
                len = ne[len - 1];
            else
            {
                ne[i] = 0;
                i++;
            }
        }
    }
}

int kmp(char *t, char *s)
{
    int lent = strlen(t);
    int lens = strlen(s);
    int ne[lens];
    next(s, lens, ne);
    int i = 0, j = 0;
    while (i < lent)
    {
        if (s[j] == t[i])
        {
            j++;
            i++;
        }
        if (j == lens)
        {
            return i - j;
        }
        else if (i < lent && s[j] != t[i])
        {
            if (j != 0)
                j = ne[j - 1];
            else
                i++;
        }
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