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

int isEmailValid(const char *email)
{
    if (email == NULL || *email == '\0')
    {
        return 0; // 空指针或空字符串不是有效的邮箱
    }

    int len = strlen(email);
    int at_count = 0;
    int dot_count = 0;
    int at_index = -1;
    int last_dot_index = -1;

    if (len > 80)
    {
        return 0; // 邮箱地址超过最大长度限制
    }

    // 1. 基本格式检查：至少包含一个'@'和一个'.'
    for (int i = 0; i < len; i++)
    {
        if (email[i] == '@')
        {
            at_count++;
            at_index = i;
        }
        else if (email[i] == '.')
        {
            dot_count++;
            last_dot_index = i;
        }
    }

    if (at_count != 1 || dot_count == 0)
    {
        return 0; // 必须有且仅有一个'@'，并且至少有一个'.'
    }

    // 2. '@' 和 '.' 的位置检查
    if (at_index == 0 || at_index == len - 1)
    {
        return 0; // '@'不能在开头或结尾
    }

    if (last_dot_index < at_index + 2 || last_dot_index == len - 1)
    {
        return 0; // '.'必须在'@'之后，并且不能是最后一个字符
    }

    // 3. 字符合法性检查
    for (int i = 0; i < len; i++)
    {
        char c = email[i];

        if (!(isalnum(c) || c == '.' || c == '_' || c == '-' || c == '@'))
        {
            return 0; // 只允许字母数字、'.'、'_'、'-'、'@'
        }

        // 严格检查空格: 不允许任何空格
        if (isspace(c))
        {
            return 0;
        }
    }

    // 4. '@' 前后的部分检查

    // 4.1 local part 检查 (('@'前))
    for (int i = 0; i < at_index; i++)
    {
        // 允许字母数字、'_'、'-'、'.'
        if (!(isalnum(email[i]) || email[i] == '_' || email[i] == '-' || email[i] == '.'))
        {
            return 0;
        }

        // 不允许连续的'.'  (例如 '..')
        if (i > 0 && email[i] == '.' && email[i - 1] == '.')
        {
            return 0;
        }
    }

    // local part 不能以'.'开头或结尾 (增强的验证)
    if (email[0] == '.' || email[at_index - 1] == '.')
    {
        return 0;
    }

    // 4.2 domain part 检查 (('@'后))

    // 4.2.1 至少包含一级域名 (例如 'example.com')
    char *domain = (char *)email + at_index + 1; // 指向域名部分的指针
    if (strchr(domain, '.') == NULL)
    {
        return 0; // 域名必须包含至少一个'.'
    }

    // 4.2.2 各个部分的字符检查
    char *token = strtok((char *)domain, "."); // strtok modifies the string, cast away const
    while (token != NULL)
    {
        int token_len = strlen(token);
        if (token_len == 0)
            return 0; // 不允许空的域名段, 比如 'abc@.com'

        for (int i = 0; i < token_len; i++)
        {
            if (!(isalnum(token[i]) || token[i] == '-'))
            {
                return 0; // 域名部分只允许字母数字和'-'
            }
            if (i == 0 && token[i] == '-')
                return 0; // 域名部分不能以'-'开头
            if (i == token_len - 1 && token[i] == '-')
                return 0; // 域名部分不能以'-'结尾
        }
        token = strtok(NULL, ".");
    }

    // 5. 顶级域名 (TLD) 长度检查 (可选，可以根据实际需求增加)
    //  顶级域名通常是2-6个字符，但现在允许更长的TLD，所以可以省略，或者使用更复杂的TLD验证库。
    //  更完善的方案：可以维护一个TLD列表，与列表进行匹配。

    return 1; // 所有检查通过，是有效的邮箱
}

int isPhoneNumberValid(const char *phone_number)
{
    if (phone_number == NULL || *phone_number == '\0')
    {
        return 0; // 空指针或空字符串
    }

    int len = strlen(phone_number);

    if (len < 7 || len > 15)
    {
        return 0; // 太短或太长
    }

    int digit_count = 0;
    int hyphen_count = 0;

    // 检查字符合法性, 并统计数字和短横线的数量
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
            return 0; // 包含非法字符
        }
    }

    if (digit_count < 7)
    {
        return 0; // 数字太少
    }

    // 手机号判断
    if (digit_count >= 11 && phone_number[0] == '1' && hyphen_count == 0)
    {
        return 1; // 手机号: 至少11位数字，以1开头，不允许短横线
    }
    // 座机号判断
    else if (hyphen_count <= 1)
    {
        return 1; // 座机号: 至少7位数字，允许包含一个短横线
    }

    return 0; // 不符合手机号或座机号的格式
}

int isBirthDayValid(const char *year_str, const char *month_str, const char *day_str)
{
    if (year_str == NULL || month_str == NULL || day_str == NULL)
    {
        return 0; // 任何参数为空，则无效
    }

    // 1. 字符串转整数 (使用你的 stoi 函数)
    int year = stoi((char *)year_str);
    int month = stoi((char *)month_str);
    int day = stoi((char *)day_str);

    // 2. 转换失败检查
    if (year == 0 || month == 0 || day == 0)
    {
        // stoi 如果包含非数字字符或者超出int的范围，会返回0
        return 0; // 转换失败（stoi 返回 0 表示失败）
    }

    // 3. 范围检查
    if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31)
    {
        return 0; // 年月日超出合理范围
    }

    // 4. 获取当前日期
    time_t t = time(NULL);
    struct tm tm = *localtime(&t);
    int current_year = tm.tm_year + 1900; // tm_year是从1900年开始的偏移量
    int current_month = tm.tm_mon + 1;    // tm_mon是从0开始的
    int current_day = tm.tm_mday;

    // 5. 年份不能大于当前年份
    if (year > current_year)
    {
        return 0;
    }
    // 如果年份等于当前年份，则月份不能大于当前月份
    if (year == current_year && month > current_month)
    {
        return 0;
    }
    // 如果年份和月份都等于当前年份和月份，则日期不能大于当前日期
    if (year == current_year && month == current_month && day > current_day)
    {
        return 0;
    }

    // 6. 检查月份对应的天数，处理闰年
    int days_in_month[] = {0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0)
    {
        days_in_month[2] = 29; // 闰年2月有29天
    }

    if (day > days_in_month[month])
    {
        return 0; // 日期超出该月最大天数
    }

    return 1; // 所有检查通过，日期有效
}

int isStrValid(const char *str)
{
    if (str == NULL || *str == '\0')
    {
        return 0; // 空指针或空字符串
    }

    int len = strlen(str);
    if (len < 2 || len > 90)
    {
        return 0; // 长度不符合要求
    }

    while (*str)
    {
        // 如果不是字母、数字、空格或者汉字（高于ASCII范围的字符），视为非法
        if (!(isalnum((unsigned char)*str) || isspace((unsigned char)*str) || *str < 0))
        {
            return 0; // 字符串非法
        }
        str++;
    }
    return 1; // 字符串合法
}

int isPositiveNumberValid(const char *number_str)
{
    if (number_str == NULL || *number_str == '\0')
    {
        return 0; // 空指针或空字符串
    }

    int len = strlen(number_str);

    if (len < 1 || len > 10)
    {
        return 0; // 长度不符合要求
    }

    for (int i = 0; i < len; i++)
    {
        if (!isdigit(number_str[i]))
        {
            return 0; // 包含非数字字符
        }
    }

    if (len > 1 && number_str[0] == '0')
    {
        return 0; // 不能以 '0' 开头 (除非数字本身就是 '0')
    }
    // 将字符串转换为数字，并检查溢出
    char *endptr;
    long num = strtol(number_str, &endptr, 10);
    if (*endptr != '\0')
    { // 确保整个字符串被转换
        return 0;
    }

    if (num <= 0)
        return 0; // 确保是正数

    return 1; // 所有检查通过，是有效的正数
}

int isPasswordValid(const char *password)
{
    if (password == NULL || *password == '\0')
    {
        return 0; // 空指针或空字符串
    }

    int len = strlen(password);
    if (len < 8 || len > 20)
    {
        return 0; // 长度不符合要求
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
            return 0; // 包含非法字符（既不是字母也不是数字）
        }
    }

    if (!has_letter || !has_digit)
    {
        return 0; // 必须同时包含字母和数字
    }

    return 1; // 所有检查通过，密码有效
}

int isTimeValid(const char *year_str, const char *month_str, const char *day_str,
                const char *hour_str, const char *minute_str, const char *second_str)
{
    int year, month, day, hour, minute, second;

    // 1. NULL 检查
    if (year_str == NULL || month_str == NULL || day_str == NULL ||
        hour_str == NULL || minute_str == NULL || second_str == NULL)
    {
        return 0; // 任何一个字符串为空，则无效
    }

    // 2. 空字符串检查
    if (strlen(year_str) == 0 || strlen(month_str) == 0 || strlen(day_str) == 0 ||
        strlen(hour_str) == 0 || strlen(minute_str) == 0 || strlen(second_str) == 0)
    {
        return 0; // 任何一个字符串为空，则无效
    }

    // 3.  转换为整数 (使用你提供的 stoi 函数)
    year = stoi((char *)year_str); // 需要类型转换，去掉const属性
    month = stoi((char *)month_str);
    day = stoi((char *)day_str);
    hour = stoi((char *)hour_str);
    minute = stoi((char *)minute_str);
    second = stoi((char *)second_str);

    // 4.  stoi 转换失败检查。 因为stoi在出错时返回0，需要进行区分。
    // 如果年、月、日其中任何一个是0，说明转换出错，直接返回0
    if (year == 0 || month == 0 || day == 0)
        return 0;

    // 小时，分钟，秒  可以是0，所以要区分是否是因为格式不正确导致的返回0
    if (hour_str[0] != '0' && hour == 0 && strlen(hour_str) > 0)
        return 0;
    if (minute_str[0] != '0' && minute == 0 && strlen(minute_str) > 0)
        return 0;
    if (second_str[0] != '0' && second == 0 && strlen(second_str) > 0)
        return 0;
    // 5. 范围检查
    if (year < 1 || year > 9999)
        return 0; // 年份有效范围
    if (month < 1 || month > 12)
        return 0;
    if (hour < 0 || hour > 23)
        return 0;
    if (minute < 0 || minute > 59)
        return 0;
    if (second < 0 || second > 59)
        return 0;

    // 6. 天数检查 (考虑闰年)
    int days_in_month[] = {0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    if ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0))
    {
        days_in_month[2] = 29; // 闰年
    }

    if (day < 1 || day > days_in_month[month])
        return 0;

    return 1; // 所有检查通过，时间合法
}
int judgeGender(const char *str)
{
    if (str == NULL)
    {
        return -1;
    }
    if (strcmp(str, "男") == 0)
    {
        return 1;
    }
    else if (strcmp(str, "女") == 0)
    {
        return 2;
    }
    else if (strcmp(str, "未知") == 0)
    {
        return 3;
    }
    else
    {
        return -1;
    }
}