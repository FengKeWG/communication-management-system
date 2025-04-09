#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include "../include/client_manager.h"
#include "../include/utils.h"

Client *parseClientFromString(char *inputString, bool newID)
{
    if (!inputString)
    {
        fprintf(stderr, "请输入信息\n");
        return NULL;
    }

    Client *newClient = (Client *)malloc(sizeof(Client));
    if (!newClient)
    {
        return NULL;
    }
    memset(newClient, 0, sizeof(Client));

    char idStr[50] = {0};
    char sizeStr[50] = {0};
    char contactLevelStr[50] = {0};
    char phonesStr[1024] = {0};
    char contactsStr[4096] = {0};

    int scanned = sscanf(inputString, "%[^;];%[^;];%[^;];%[^;];%[^;];%[^;];%[^;];%[^;];%[^;];%[^\n]",
                         idStr, newClient->name, newClient->region, newClient->address, newClient->legal_person,
                         sizeStr, contactLevelStr, newClient->email, phonesStr, contactsStr);

    if (scanned < 10)
    { // 需要扫描 10 个字段
        fprintf(stderr, "输入错误请重新输入\n");
        free(newClient);
        return NULL;
    }

    // 验证 idStr ，如果 newID 为 false
    newClient->id = newID ? uidGenerate() : stoi(idStr);

    // 验证 sizeStr
    if (isPositiveNumberValid(sizeStr))
    {
        fprintf(stderr, "规模输入格式错误请重新输入\n");
        free(newClient);
        return NULL;
    }
    newClient->size = stoi(sizeStr);

    // 验证 contactLevelStr
    if (isPositiveNumberValid(contactLevelStr))
    {
        fprintf(stderr, "联络程度输入格式错误请重新输入\n");
        free(newClient);
        return NULL;
    }
    newClient->contact_level = stoi(contactLevelStr);

    newClient->phone_count = 0;
    char *phone_token = strtok(phonesStr, ",");
    while (phone_token && newClient->phone_count < 100)
    {
        scpy(newClient->phones[newClient->phone_count], phone_token, sizeof(newClient->phones[0]));
        newClient->phone_count++;
        phone_token = strtok(NULL, ",");
    }

    newClient->contact_count = 0;
    if (contactsStr[0] != '\0')
    {
        char *contact_str = strtok(contactsStr, ",");
        while (contact_str && newClient->contact_count < 100)
        {
            Contact *current_contact = &newClient->contacts[newClient->contact_count];
            memset(current_contact, 0, sizeof(Contact));

            char contact_id_str[50] = {0};
            char contact_birth_year_str[50] = {0};
            char contact_birth_month_str[50] = {0};
            char contact_birth_day_str[50] = {0};
            char contact_phones[1024] = {0};

            int contact_fields = sscanf(contact_str, "%[^=]=%[^=]=%[^=]=%[^=]=%[^=]=%[^=]=%[^=]=%[^\n]",
                                        contact_id_str, current_contact->name, current_contact->gender,
                                        contact_birth_year_str, contact_birth_month_str, contact_birth_day_str,
                                        current_contact->email, contact_phones);

            if (contact_fields < 8)
            {
                fprintf(stderr, "联系人输入存在错误请重新输入\n");
                contact_str = strtok(NULL, ",");
                continue;
            }

            // 验证联系人 ID
            current_contact->id = newID ? uidGenerate() : stoi(contact_id_str);
            // 验证联系人出生年份
            if (isBirthDayValid(contact_birth_year_str, contact_birth_month_str, contact_birth_day_str))
            {
                fprintf(stderr, "出生时间输入格式错误请重新输入\n");
                contact_str = strtok(NULL, ",");
                continue;
            }
            current_contact->birth_year = stoi(contact_birth_year_str);
            current_contact->birth_month = stoi(contact_birth_month_str);
            current_contact->birth_day = stoi(contact_birth_day_str);

            if (strlen(current_contact->gender) == 0)
                strcpy(current_contact->gender, "未知");
            if (judgeGender(current_contact->gender) == -1)
                fprintf(stderr, "性别输入错误，请重新输入\n");
            current_contact->phone_count = 0;
            if (contact_phones[0] != '\0')
            {
                char *phone_start = contact_phones;
                char *delimiter;
                while ((delimiter = strchr(phone_start, '~')) && current_contact->phone_count < 100)
                {
                    *delimiter = '\0';
                    if (strlen(phone_start) > 0)
                    {
                        scpy(current_contact->phones[current_contact->phone_count], phone_start, sizeof(current_contact->phones[0]));
                        current_contact->phone_count++;
                    }
                    phone_start = delimiter + 1;
                }
                if (strlen(phone_start) > 0 && current_contact->phone_count < 100)
                {
                    scpy(current_contact->phones[current_contact->phone_count], phone_start, sizeof(current_contact->phones[0]));
                    current_contact->phone_count++;
                }
            }

            newClient->contact_count++;
            contact_str = strtok(NULL, ",");
        }
    }

    newClient->next = NULL;
    return newClient;
}

Client *addClient(Client *head, Client *newClient)
{
    if (!newClient)
    {
        return head;
    }
    if (head)
    {
        Client *current = head;
        while (current->next)
        {
            current = current->next;
        }
        current->next = newClient;
    }
    else
    {
        head = newClient;
    }
    printf("客户 '%s' 添加成功！\n", newClient->name);
    fflush(stdout);
    return head;
}

Client *deleteClient(Client *head, int id)
{
    Client *current = head;
    Client *prev = NULL;
    while (current && current->id != id)
    {
        prev = current;
        current = current->next;
    }
    if (!current)
    {
        fprintf(stderr, "未找到要删除的联络员 ID: %d\n", id);
        return head;
    }
    if (!prev)
    {
        head = current->next;
    }
    else
    {
        prev->next = current->next;
    }
    printf("联络员 ID %d (%s) 已删除。\n", current->id, current->name);
    free(current);
    return head;
}

Client *modifyClient(Client *head, Client *newClient)
{
    if (!head)
        return newClient;
    Client *current = head;
    Client *prev = NULL;
    while (current)
    {
        if (current->id == newClient->id)
        {
            if (current == head)
            {
                newClient->next = current->next;
            }
            else
            {
                prev->next = newClient;
                newClient->next = current->next;
            }
            printf("联络员 ID %d (%s) 信息已更新。\n", newClient->id, newClient->name);
            free(current);
            return head;
        }
        prev = current;
        current = current->next;
    }
    return head;
}

int cmpClient(Client *a, Client *b, int num)
{
    switch (num)
    {
    case 1:
        return a->id - b->id;
    case 2:
        return strcmp(a->name, b->name);
    case 3:
        return strcmp(a->region, b->region);
    case 4:
        return strcmp(a->address, b->address);
    case 5:
        return strcmp(a->legal_person, b->legal_person);
    case 6:
        return a->size - b->size;
    case 7:
        return a->contact_level - b->contact_level;
    case 8:
        return strcmp(a->email, b->email);
    case 9:
        return a->phone_count - b->phone_count;
    case 10:
        return a->contact_count - b->contact_count;
    case -1:
        return b->id - a->id;
    case -2:
        return strcmp(b->name, a->name);
    case -3:
        return strcmp(b->region, a->region);
    case -4:
        return strcmp(b->address, a->address);
    case -5:
        return strcmp(b->legal_person, a->legal_person);
    case -6:
        return b->size - a->size;
    case -7:
        return b->contact_level - a->contact_level;
    case -8:
        return strcmp(b->email, a->email);
    case -9:
        return b->phone_count - a->phone_count;
    case -10:
        return b->contact_count - a->contact_count;
    default:
        return 0;
    }
}

Client *mergeClientSortedLists(Client *list1, Client *list2, int cnt, int a[])
{
    if (!list1)
        return list2;
    if (!list2)
        return list1;
    Client *sortedList = NULL;
    for (int i = 0; i < cnt; i++)
    {
        if (cmpClient(list1, list2, a[i]) < 0)
        {
            sortedList = list1;
            sortedList->next = mergeClientSortedLists(list1->next, list2, cnt, a);
            break;
        }
        else if (cmpClient(list1, list2, a[i]) > 0)
        {
            sortedList = list2;
            sortedList->next = mergeClientSortedLists(list1, list2->next, cnt, a);
            break;
        }
    }
    if (!sortedList)
    {
        sortedList = list1;
        sortedList->next = mergeClientSortedLists(list1->next, list2, cnt, a);
    }
    return sortedList;
}

void splitClientList(Client *head, Client **front, Client **back)
{
    Client *slow = head;
    Client *fast = head->next;
    while (fast)
    {
        fast = fast->next;
        if (fast)
        {
            slow = slow->next;
            fast = fast->next;
        }
    }
    *front = head;
    *back = slow->next;
    slow->next = NULL;
}

Client *mergeSortClient(Client *head, int cnt, int a[])
{
    if (!head || !head->next)
        return head;
    Client *front = NULL;
    Client *back = NULL;
    splitClientList(head, &front, &back);
    front = mergeSortClient(front, cnt, a);
    back = mergeSortClient(back, cnt, a);
    return mergeClientSortedLists(front, back, cnt, a);
}

/**
 * @brief 显示客户信息，支持排序、按销售ID过滤、多字段搜索和全局模式匹配。
 *
 * @param head 指向客户链表头节点的指针。
 * @param pattern 全局搜索模式（在多个字段中搜索）。
 * @param sortKeys 指向排序关键字数组的指针（整数，代表按哪些字段排序）。
 * @param sortKeyCount 排序关键字的数量。
 * @param filter_sales_id 要筛选的销售人员ID（大于0时生效）。
 * @param salesList 指向销售人员列表的指针（用于根据 filter_sales_id 查找客户）。
 * @param searchName 按客户名称搜索的字符串。
 * @param searchRegion 按区域搜索的字符串。
 * @param searchAddress 按地址搜索的字符串。
 * @param searchLegalPerson 按法人搜索的字符串。
 * @param searchSize 按规模搜索的字符串（支持 ">=", "<=", "==", ">", "<" 或直接数字匹配）。
 * @param searchContactLevel 按联系级别搜索的字符串（支持 ">=", "<=", "==", ">", "<" 或直接数字匹配）。
 * @param searchEmail 按邮箱搜索的字符串。
 * @param searchContactCount 按联系人数量搜索的字符串（支持 ">=", "<=", "==", ">", "<" 或直接数字匹配）。
 */
void displayClients(Client *head, const char *pattern, int *sortKeys, int sortKeyCount, int filter_sales_id, Sales *salesList, const char *searchName, const char *searchRegion, const char *searchAddress, const char *searchLegalPerson, const char *searchSize, const char *searchContactLevel, const char *searchEmail, const char *searchContactCount)
{
    // 1. 排序 (如果需要)
    // 检查是否有排序要求 (排序键数量大于0 且 排序键数组存在)
    if (sortKeyCount > 0 && sortKeys)
    {
        // 调用归并排序函数对客户链表进行排序
        // 注意：mergeSortClient 应该返回排序后新的链表头指针
        head = mergeSortClient(head, sortKeyCount, sortKeys);
    }

    // 2. 销售人员过滤准备
    Sales *targetSales = NULL; // 指向目标销售记录的指针，初始为 NULL
    // 检查是否需要按销售ID过滤 (ID > 0 且 销售列表存在)
    if (filter_sales_id > 0 && salesList)
    {
        // 根据 ID 查找对应的销售记录
        targetSales = findSalesById(salesList, filter_sales_id);
        // 如果找不到指定的销售人员记录，则直接返回，不显示任何客户
        if (!targetSales)
        {
            return; // 提前退出函数
        }
    }

    // 3. 初始化遍历和缓冲区
    Client *current = head;      // current 指针用于遍历客户链表，从头节点开始
    char text[15000];            // 用于存储拼接后的客户所有文本信息，以进行全局模式匹配 (pattern)
    char tmp[200];               // 临时缓冲区，主要用于数字转字符串
    char lowerFieldBuffer[1024]; // 用于存储字段的小写版本，以进行不区分大小写的搜索
    char numericStrBuffer[50];   // 用于存储数字字段转换为字符串后的值，以进行字符串方式的数字匹配
    int match_count = 0;         // 匹配并显示的客户数量计数器 (注意：代码中没有增加这个计数，最后打印可能总是0)

    // 4. 遍历客户链表
    while (current) // 当 current 指针不为 NULL 时，继续循环
    {
        // 5. 检查每个客户是否应该被显示
        bool should_display = true; // 标志位，初始假设该客户应该被显示

        // 5.1 按销售人员过滤
        // 如果设置了目标销售人员 (targetSales 不为 NULL)
        if (targetSales)
        {
            should_display = false; // 先假设不显示，除非在目标销售的客户列表中找到
            // 遍历目标销售人员负责的客户ID列表
            for (int i = 0; i < targetSales->client_count; i++)
            {
                // 如果当前客户的 ID 在列表中
                if (targetSales->client_ids[i] == current->id)
                {
                    should_display = true; // 标记为应该显示
                    break;                 // 找到后即可跳出内层循环
                }
            }
        }

        // 5.2 按各字段搜索 (仅当 should_display 仍为 true 时才继续检查)
        // 按客户名称搜索
        if (should_display && searchName && strlen(searchName) > 0)
        {
            scpy(lowerFieldBuffer, current->name, sizeof(lowerFieldBuffer)); // 复制客户名称到缓冲区
            toLower(lowerFieldBuffer);                                       // 转换为小写
            // 使用 KMP 算法在小写字段中搜索小写搜索词 (假设 searchName 也是小写或 KMP 能处理)
            if (kmp(lowerFieldBuffer, searchName) < 0) // KMP 返回 -1 表示未找到
                should_display = false;                // 不匹配，标记为不显示
        }

        // 按区域搜索 (逻辑同上)
        if (should_display && searchRegion && strlen(searchRegion) > 0)
        {
            scpy(lowerFieldBuffer, current->region, sizeof(lowerFieldBuffer));
            toLower(lowerFieldBuffer);
            if (kmp(lowerFieldBuffer, searchRegion) < 0)
                should_display = false;
        }

        // 按地址搜索 (逻辑同上)
        if (should_display && searchAddress && strlen(searchAddress) > 0)
        {
            scpy(lowerFieldBuffer, current->address, sizeof(lowerFieldBuffer));
            toLower(lowerFieldBuffer);
            if (kmp(lowerFieldBuffer, searchAddress) < 0)
                should_display = false;
        }

        // 按法人搜索 (逻辑同上)
        if (should_display && searchLegalPerson && strlen(searchLegalPerson) > 0)
        {
            scpy(lowerFieldBuffer, current->legal_person, sizeof(lowerFieldBuffer));
            toLower(lowerFieldBuffer);
            if (kmp(lowerFieldBuffer, searchLegalPerson) < 0)
                should_display = false;
        }

        // 按邮箱搜索 (逻辑同上)
        if (should_display && searchEmail && strlen(searchEmail) > 0)
        {
            scpy(lowerFieldBuffer, current->email, sizeof(lowerFieldBuffer));
            toLower(lowerFieldBuffer);
            if (kmp(lowerFieldBuffer, searchEmail) < 0)
                should_display = false;
        }

        // 按规模搜索 (支持比较操作符)
        if (should_display && searchSize && strlen(searchSize) > 0)
        {
            char op[3] = "";                // 存储比较操作符 (如 ">=", "<", "==")
            int targetVal = 0;              // 存储要比较的目标数值
            int offset = 0;                 // 操作符的长度 (用于跳过操作符读取数字)
            bool useNumericCompare = false; // 标志是否成功解析为数值比较

            // 检查开头的操作符
            if (strncmp(searchSize, ">=", 2) == 0)
            {
                strcpy(op, ">=");
                offset = 2;
            }
            else if (strncmp(searchSize, "<=", 2) == 0)
            {
                strcpy(op, "<=");
                offset = 2;
            }
            else if (strncmp(searchSize, "==", 2) == 0)
            {
                strcpy(op, "==");
                offset = 2;
            }
            else if (strncmp(searchSize, ">", 1) == 0)
            {
                strcpy(op, ">");
                offset = 1;
            }
            else if (strncmp(searchSize, "<", 1) == 0)
            {
                strcpy(op, "<");
                offset = 1;
            }

            // 如果找到了操作符
            if (offset > 0)
            {
                // 尝试从操作符之后的位置解析整数
                // 使用 sscanf 读取数字，并检查后面是否紧跟非数字字符（通过 %c）
                // 如果 sscanf 返回 1，说明只成功读取了数字，没有多余的非空白字符
                char check_end;
                if (sscanf(searchSize + offset, "%d %c", &targetVal, &check_end) == 1)
                {
                    useNumericCompare = true; // 解析成功，使用数值比较
                }
            }

            // 如果使用数值比较
            if (useNumericCompare)
            {
                bool match = false; // 比较结果
                // 根据操作符进行比较
                if (strcmp(op, ">=") == 0)
                    match = (current->size >= targetVal);
                else if (strcmp(op, "<=") == 0)
                    match = (current->size <= targetVal);
                else if (strcmp(op, "==") == 0)
                    match = (current->size == targetVal);
                else if (strcmp(op, ">") == 0)
                    match = (current->size > targetVal);
                else if (strcmp(op, "<") == 0)
                    match = (current->size < targetVal);

                // 如果比较结果不匹配
                if (!match)
                    should_display = false; // 标记为不显示
            }
            else // 如果没有解析出操作符和数字，或者解析失败，则进行字符串匹配
            {
                // 将当前客户的规模 (数字) 转换为字符串
                snprintf(numericStrBuffer, sizeof(numericStrBuffer), "%d", current->size);
                // 在转换后的数字字符串中搜索原始的搜索字符串 (例如，搜索 "50" 是否在 "150" 中)
                if (kmp(numericStrBuffer, searchSize) < 0) // 未找到
                    should_display = false;                // 标记为不显示
            }
        }

        // 按联系人数量搜索 (逻辑同规模搜索)
        if (should_display && searchContactCount && strlen(searchContactCount) > 0)
        {
            char op[3] = "";
            int targetVal = 0;
            int offset = 0;
            bool useNumericCompare = false;
            // 解析操作符
            if (strncmp(searchContactCount, ">=", 2) == 0)
            {
                strcpy(op, ">=");
                offset = 2;
            }
            else if (strncmp(searchContactCount, "<=", 2) == 0)
            {
                strcpy(op, "<=");
                offset = 2;
            }
            else if (strncmp(searchContactCount, "==", 2) == 0)
            {
                strcpy(op, "==");
                offset = 2;
            }
            else if (strncmp(searchContactCount, ">", 1) == 0)
            {
                strcpy(op, ">");
                offset = 1;
            }
            else if (strncmp(searchContactCount, "<", 1) == 0)
            {
                strcpy(op, "<");
                offset = 1;
            }

            // 解析数字
            if (offset > 0)
            {
                char check_end;
                if (sscanf(searchContactCount + offset, "%d %c", &targetVal, &check_end) == 1)
                    useNumericCompare = true;
            }

            // 进行比较或字符串搜索
            if (useNumericCompare)
            {
                bool match = false;
                if (strcmp(op, ">=") == 0)
                    match = (current->contact_count >= targetVal);
                else if (strcmp(op, "<=") == 0)
                    match = (current->contact_count <= targetVal);
                else if (strcmp(op, "==") == 0)
                    match = (current->contact_count == targetVal);
                else if (strcmp(op, ">") == 0)
                    match = (current->contact_count > targetVal);
                else if (strcmp(op, "<") == 0)
                    match = (current->contact_count < targetVal);
                if (!match)
                    should_display = false;
            }
            else
            {
                snprintf(numericStrBuffer, sizeof(numericStrBuffer), "%d", current->contact_count);
                if (kmp(numericStrBuffer, searchContactCount) < 0)
                    should_display = false;
            }
        }

        // 按联系级别搜索 (逻辑同规模搜索)
        if (should_display && searchContactLevel && strlen(searchContactLevel) > 0)
        {
            char op[3] = "";
            int targetVal = 0;
            int offset = 0;
            bool useNumericCompare = false;
            // 解析操作符
            if (strncmp(searchContactLevel, ">=", 2) == 0)
            {
                strcpy(op, ">=");
                offset = 2;
            }
            else if (strncmp(searchContactLevel, "<=", 2) == 0)
            {
                strcpy(op, "<=");
                offset = 2;
            }
            else if (strncmp(searchContactLevel, "==", 2) == 0)
            {
                strcpy(op, "==");
                offset = 2;
            }
            else if (strncmp(searchContactLevel, ">", 1) == 0)
            {
                strcpy(op, ">");
                offset = 1;
            }
            else if (strncmp(searchContactLevel, "<", 1) == 0)
            {
                strcpy(op, "<");
                offset = 1;
            }

            // 解析数字
            if (offset > 0)
            {
                char check_end;
                if (sscanf(searchContactLevel + offset, "%d %c", &targetVal, &check_end) == 1)
                    useNumericCompare = true;
            }

            // 进行比较或字符串搜索
            if (useNumericCompare)
            {
                bool match = false;
                if (strcmp(op, ">=") == 0)
                    match = (current->contact_level >= targetVal);
                else if (strcmp(op, "<=") == 0)
                    match = (current->contact_level <= targetVal);
                else if (strcmp(op, "==") == 0)
                    match = (current->contact_level == targetVal);
                else if (strcmp(op, ">") == 0)
                    match = (current->contact_level > targetVal);
                else if (strcmp(op, "<") == 0)
                    match = (current->contact_level < targetVal);
                if (!match)
                    should_display = false;
            }
            else
            {
                snprintf(numericStrBuffer, sizeof(numericStrBuffer), "%d", current->contact_level);
                if (kmp(numericStrBuffer, searchContactLevel) < 0)
                    should_display = false;
            }
        }

        // 5.3 全局模式匹配 (pattern)
        // 如果前面的过滤器都通过了，并且提供了全局搜索模式 (pattern)
        if (should_display && pattern && strlen(pattern) > 0)
        {
            text[0] = '\0'; // 清空 text 缓冲区 (置第一个字符为空字符)

            // 将客户的各个字段（包括数字转字符串、联系人信息等）拼接到 text 缓冲区
            snprintf(tmp, sizeof(tmp), "%d", current->id);            // ID 转字符串
            strcat(text, tmp);                                        // 拼接 ID
            strcat(text, current->name);                              // 拼接名称
            strcat(text, current->region);                            // 拼接区域
            strcat(text, current->address);                           // 拼接地址
            strcat(text, current->legal_person);                      // 拼接法人
            snprintf(tmp, sizeof(tmp), "%d", current->size);          // 规模转字符串
            strcat(text, tmp);                                        // 拼接规模
            snprintf(tmp, sizeof(tmp), "%d", current->contact_level); // 联系级别转字符串
            strcat(text, tmp);                                        // 拼接联系级别
            strcat(text, current->email);                             // 拼接邮箱

            // 拼接客户的电话号码
            for (int i = 0; i < current->phone_count; i++)
                strcat(text, current->phones[i]);

            // 拼接所有联系人的信息
            for (int i = 0; i < current->contact_count; i++)
            {
                strcat(text, current->contacts[i].name);   // 拼接联系人姓名
                strcat(text, current->contacts[i].gender); // 拼接联系人性别
                strcat(text, current->contacts[i].email);  // 拼接联系人邮箱
                // 拼接联系人的电话号码
                for (int j = 0; j < current->contacts[i].phone_count; j++)
                    strcat(text, current->contacts[i].phones[j]);
            }

            toLower(text); // 将整个拼接好的文本转换为小写
            // 在小写文本中搜索小写模式 (假设 pattern 也是小写或 KMP 能处理)
            if (kmp(text, pattern) < 0) // 未找到
                should_display = false; // 标记为不显示
        }

        // 6. 输出符合条件的客户信息
        // 如果经过所有过滤和搜索后，should_display 仍然为 true
        if (should_display)
        {
            // 打印客户的基本信息，字段间用分号 ";" 分隔
            printf("%d;%s;%s;%s;%s;%d;%d;%s;", current->id, current->name, current->region, current->address, current->legal_person, current->size, current->contact_level, current->email);

            // 打印客户的电话号码，号码间用逗号 "," 分隔
            for (int i = 0; i < current->phone_count; i++)
                printf("%s%s", current->phones[i], (i == current->phone_count - 1) ? "" : ","); // 最后一个号码后面不加逗号
            printf(";");                                                                        // 电话号码结束后加分号

            // 打印联系人信息，联系人间用逗号 "," 分隔
            for (int i = 0; i < current->contact_count; i++)
            {
                Contact *c = &current->contacts[i]; // 获取当前联系人的指针
                // 打印联系人的字段，字段间用等号 "=" 分隔
                printf("%d=%s=%s=%d=%d=%d=%s=", c->id, c->name, c->gender, c->birth_year, c->birth_month, c->birth_day, c->email);
                // 打印联系人的电话号码，号码间用波浪号 "~" 分隔
                for (int j = 0; j < c->phone_count; j++)
                    printf("%s%s", c->phones[j], (j == c->phone_count - 1) ? "" : "~"); // 最后一个号码后面不加波浪号
                // 如果不是最后一个联系人，则在其后加逗号分隔符
                if (i < current->contact_count - 1)
                    printf(",");
            }
            printf("\n"); // 打印完一个客户的所有信息后换行

            // 注意：这里应该增加 match_count 计数器，例如: match_count++;
            // 但原始代码中没有，所以下面的 printf("%d\n", match_count); 会一直输出 0
        }

        // 7. 移动到下一个客户节点
        current = current->next;
    }

    // 8. 打印匹配到的客户数量 (根据原始代码，这里会打印 0)
    printf("%d\n", match_count);
}

void displayClientIdsAndNames(Client *head)
{
    Client *current = head;
    while (current)
    {
        printf("%d,%s", current->id, current->name);
        if (current->next)
            printf(";");
        current = current->next;
    }
    printf("\n");
}

void displayClientContactsIdsAndNames(Client *head, int id)
{
    Client *current = head;
    while (current)
    {
        if (current->id == id)
        {
            for (int i = 0; i < current->contact_count; i++)
            {
                Contact *contact = &current->contacts[i];
                printf("%d,%s", contact->id, contact->name);
                if (i < current->contact_count - 1)
                    printf(";");
            }
            printf("\n");
            return;
        }
        current = current->next;
    }
}

void freeClientList(Client *head)
{
    Client *current = head;
    Client *next_node;
    while (current)
    {
        next_node = current->next;
        free(current);
        current = next_node;
    }
}