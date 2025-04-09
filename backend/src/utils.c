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
    ne[0] = -1; // 注意这里改为-1
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
        if (j == n - 1)       // 修改这里：当j等于n-1时表示匹配成功
            return i - n + 1; // 返回匹配开始的位置
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