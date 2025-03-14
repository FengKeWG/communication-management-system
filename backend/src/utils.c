#include <stdio.h>
#include <string.h>

// kmp匹配
void calculateNext(char *s, int *ne)
{
    ne[1] = 0;
    int len = strlen(s); // 模式串的长度
    for (int i = 2, j = 0; i <= len; i++)
    {
        while (j && s[i - 1] != s[j])
            j = ne[j];
        if (s[i - 1] == s[j])
            j++;
        ne[i] = j;
    }
}

void calculateKMP(char *s, char *t, int *ne)
{
    calculateNext(s, ne);
    int len_t = strlen(t);
    int len_s = strlen(s);
    int check = 0;
    for (int i = 1, j = 0; i <= len_t; i++)
    {
        while (j && t[i - 1] != s[j])
            j = ne[j];
        if (t[i - 1] == s[j])
            j++;
        if (j == len_s)
        {
            printf("%d\n", i - len_s + 1);
            check = 1;
        }
    }
    if (!check)
        printf("-1\n");
}
