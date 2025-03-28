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
    for (int i = 0; s[i]; i++)
        s[i] = tolower((unsigned char)s[i]);
}