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
        fprintf(stderr, "内存分配失败\n");
        return NULL;
    }
    memset(newClient, 0, sizeof(Client));
    char idStr[50] = {0};
    char sizeStr[50] = {0};
    char contactLevelStr[50] = {0};
    char phonesStr[1024] = {0};
    char contactsStr[4096] = {0};

    int scanned = sscanf(inputString, "%49[^\x1C]\x1C%99[^\x1C]\x1C%99[^\x1C]\x1C%99[^\x1C]\x1C%99[^\x1C]\x1C%49[^\x1C]\x1C%49[^\x1C]\x1C%99[^\x1C]\x1C%1023[^\x1C]\x1C%4095[^\n]", idStr, newClient->name, newClient->region, newClient->address, newClient->legal_person, sizeStr, contactLevelStr, newClient->email, phonesStr, contactsStr);

    if (scanned < 9)
    {
        fprintf(stderr, "输入错误请重新输入\n");
        free(newClient);
        return NULL;
    }

    newClient->id = newID ? uidGenerate() : stoi(idStr);
    if (!isPositiveNumberValid(sizeStr))
    {
        fprintf(stderr, "规模格式错误，请重新输入 %s\n", sizeStr);
        free(newClient);
        return NULL;
    }
    newClient->size = stoi(sizeStr);
    if (!isPositiveNumberValid(contactLevelStr))
    {
        fprintf(stderr, "联络程度格式错误，请重新输入 %s\n", contactLevelStr);
        free(newClient);
        return NULL;
    }
    newClient->contact_level = stoi(contactLevelStr);

    if (!isEmailValid(newClient->email))
    {
        fprintf(stderr, "邮箱格式错误，请重新输入 %s\n", newClient->email);
        free(newClient);
        return NULL;
    }

    newClient->phone_count = 0;
    if (phonesStr[0] != '\0')
    {
        char *phone_token = strtok(phonesStr, "\x1D");
        while (phone_token && newClient->phone_count < 100)
        {
            if (!isPhoneNumberValid(phone_token))
            {
                fprintf(stderr, "电话格式错误，请重新输入 %s\n", phone_token);
                free(newClient);
                return NULL;
            }
            scpy(newClient->phones[newClient->phone_count], phone_token, sizeof(newClient->phones[0]));
            newClient->phone_count++;
            phone_token = strtok(NULL, "\x1D");
        }
    }
    newClient->contact_count = 0;
    if (contactsStr[0] != '\0')
    {
        char *contact_str;
        char *contact_saveptr;
        contact_str = strtok_r(contactsStr, "\x1D", &contact_saveptr);
        while (contact_str != NULL && newClient->contact_count < 100)
        {
            if (strlen(contact_str) < 5)
            {
                contact_str = strtok(NULL, "\x1D");
                continue;
            }
            Contact *current_contact = &newClient->contacts[newClient->contact_count];
            memset(current_contact, 0, sizeof(Contact));
            char contact_id_str[50] = {0};
            char contact_birth_year_str[50] = {0};
            char contact_birth_month_str[50] = {0};
            char contact_birth_day_str[50] = {0};
            char contact_phones_str[1024] = {0};

            int contact_fields = sscanf(contact_str, "%49[^\x1E]\x1E%99[^\x1E]\x1E%9[^\x1E]\x1E%4[^\x1E]\x1E%4[^\x1E]\x1E%4[^\x1E]\x1E%99[^\x1E]\x1E%1023[^\n]", contact_id_str, current_contact->name, current_contact->gender, contact_birth_year_str, contact_birth_month_str, contact_birth_day_str, current_contact->email, contact_phones_str);
            if (contact_fields < 8)
            {
                fprintf(stderr, "联系人输入存在错误，请重新输入\n");
                free(newClient);
                return NULL;
            }

            current_contact->id = newID ? uidGenerate() : stoi(contact_id_str);
            if (!isBirthDayValid(contact_birth_year_str, contact_birth_month_str, contact_birth_day_str))
            {
                fprintf(stderr, "出生时间格式错误，请重新输入 %s-%s-%s\n", contact_birth_year_str, contact_birth_month_str, contact_birth_day_str);
                free(newClient);
                return NULL;
            }
            current_contact->birth_year = stoi(contact_birth_year_str);
            current_contact->birth_month = stoi(contact_birth_month_str);
            current_contact->birth_day = stoi(contact_birth_day_str);

            if (strlen(current_contact->gender) == 0)
                strcpy(current_contact->gender, "未知");
            if (isGenderValid(current_contact->gender) == -1)
            {
                fprintf(stderr, "性别输入错误，请重新输入 %s\n", current_contact->gender);
                free(newClient);
                return NULL;
            }
            if (!isEmailValid(current_contact->email))
            {
                fprintf(stderr, "联系人邮箱格式错误，请重新输入 %s\n", current_contact->email);
                free(newClient);
                return NULL;
            }
            current_contact->phone_count = 0;

            if (contact_phones_str[0] != '\0')
            {
                char *cphone_token;
                char *cphone_saveptr;
                cphone_token = strtok_r(contact_phones_str, "\x1F", &cphone_saveptr);
                while (cphone_token && current_contact->phone_count < 100)
                {
                    if (strlen(cphone_token) > 0)
                    {
                        if (!isPhoneNumberValid(cphone_token))
                        {
                            fprintf(stderr, "联系人电话格式错误，请重新输入 %s\n", cphone_token);
                            free(newClient);
                            return NULL;
                        }
                        scpy(current_contact->phones[current_contact->phone_count], cphone_token, sizeof(current_contact->phones[0]));
                        current_contact->phone_count++;
                    }
                    cphone_token = strtok_r(NULL, "\x1F", &cphone_saveptr);
                }
            }
            newClient->contact_count++;
            contact_str = strtok_r(NULL, "\x1D", &contact_saveptr);
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
        fprintf(stderr, "未找到要删除的客户 ID: %d\n", id);
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
    printf("客户 ID %d (%s) 已删除\n", current->id, current->name);
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
            newClient->next = current->next;
            if (!prev)
            {
                head = newClient;
            }
            else
            {
                prev->next = newClient;
                newClient->next = current->next;
            }
            printf("客户 ID %d (%s) 信息已更新\n", newClient->id, newClient->name);
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

void displayClients(Client *head, const char *pattern, int *sortKeys, int sortKeyCount, int filter_sales_id, Sales *salesList, const char *searchName, const char *searchRegion, const char *searchAddress, const char *searchLegalPerson, const char *searchSize, const char *searchContactLevel, const char *searchEmail, const char *searchContactCount)
{
    if (sortKeyCount > 0 && sortKeys)
    {
        head = mergeSortClient(head, sortKeyCount, sortKeys);
    }
    Sales *targetSales = NULL;
    if (filter_sales_id > 0 && salesList)
    {
        targetSales = findSalesById(salesList, filter_sales_id);
        if (!targetSales)
        {
            return;
        }
    }
    Client *current = head;
    char text[15000];
    char tmp[200];
    char lowerFieldBuffer[1024];
    char numericStrBuffer[50];
    int match_count = 0;
    while (current)
    {
        bool should_display = true;
        if (targetSales)
        {
            should_display = false;
            for (int i = 0; i < targetSales->client_count; i++)
            {
                if (targetSales->client_ids[i] == current->id)
                {
                    should_display = true;
                    break;
                }
            }
        }
        if (should_display && searchName && strlen(searchName) > 0)
        {
            scpy(lowerFieldBuffer, current->name, sizeof(lowerFieldBuffer));
            toLower(lowerFieldBuffer);
            if (kmp(lowerFieldBuffer, searchName) < 0)
                should_display = false;
        }
        if (should_display && searchRegion && strlen(searchRegion) > 0)
        {
            scpy(lowerFieldBuffer, current->region, sizeof(lowerFieldBuffer));
            toLower(lowerFieldBuffer);
            if (kmp(lowerFieldBuffer, searchRegion) < 0)
                should_display = false;
        }
        if (should_display && searchAddress && strlen(searchAddress) > 0)
        {
            scpy(lowerFieldBuffer, current->address, sizeof(lowerFieldBuffer));
            toLower(lowerFieldBuffer);
            if (kmp(lowerFieldBuffer, searchAddress) < 0)
                should_display = false;
        }
        if (should_display && searchLegalPerson && strlen(searchLegalPerson) > 0)
        {
            scpy(lowerFieldBuffer, current->legal_person, sizeof(lowerFieldBuffer));
            toLower(lowerFieldBuffer);
            if (kmp(lowerFieldBuffer, searchLegalPerson) < 0)
                should_display = false;
        }
        if (should_display && searchEmail && strlen(searchEmail) > 0)
        {
            scpy(lowerFieldBuffer, current->email, sizeof(lowerFieldBuffer));
            toLower(lowerFieldBuffer);
            if (kmp(lowerFieldBuffer, searchEmail) < 0)
                should_display = false;
        }
        if (should_display && searchSize && strlen(searchSize) > 0)
        {
            char op[3] = "";
            int targetVal = 0;
            int offset = 0;
            bool useNumericCompare = false;
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
            if (offset > 0)
            {
                char check_end;
                if (sscanf(searchSize + offset, "%d %c", &targetVal, &check_end) == 1)
                {
                    useNumericCompare = true;
                }
            }
            if (useNumericCompare)
            {
                bool match = false;
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
                if (!match)
                    should_display = false;
            }
            else
            {
                snprintf(numericStrBuffer, sizeof(numericStrBuffer), "%d", current->size);
                if (kmp(numericStrBuffer, searchSize) < 0)
                    should_display = false;
            }
        }
        if (should_display && searchContactCount && strlen(searchContactCount) > 0)
        {
            char op[3] = "";
            int targetVal = 0;
            int offset = 0;
            bool useNumericCompare = false;
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
            if (offset > 0)
            {
                char check_end;
                if (sscanf(searchContactCount + offset, "%d %c", &targetVal, &check_end) == 1)
                    useNumericCompare = true;
            }
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
        if (should_display && searchContactLevel && strlen(searchContactLevel) > 0)
        {
            char op[3] = "";
            int targetVal = 0;
            int offset = 0;
            bool useNumericCompare = false;
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
            if (offset > 0)
            {
                char check_end;
                if (sscanf(searchContactLevel + offset, "%d %c", &targetVal, &check_end) == 1)
                    useNumericCompare = true;
            }
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
        if (should_display && pattern && strlen(pattern) > 0)
        {
            text[0] = '\0';
            snprintf(tmp, sizeof(tmp), "%d", current->id);
            strcat(text, tmp);
            strcat(text, current->name);
            strcat(text, current->region);
            strcat(text, current->address);
            strcat(text, current->legal_person);
            snprintf(tmp, sizeof(tmp), "%d", current->size);
            strcat(text, tmp);
            snprintf(tmp, sizeof(tmp), "%d", current->contact_level);
            strcat(text, tmp);
            strcat(text, current->email);
            for (int i = 0; i < current->phone_count; i++)
                strcat(text, current->phones[i]);
            for (int i = 0; i < current->contact_count; i++)
            {
                strcat(text, current->contacts[i].name);
                strcat(text, current->contacts[i].gender);
                strcat(text, current->contacts[i].email);
                for (int j = 0; j < current->contacts[i].phone_count; j++)
                    strcat(text, current->contacts[i].phones[j]);
            }
            toLower(text);
            if (kmp(text, pattern) < 0)
                should_display = false;
        }
        if (should_display)
        {
            printf("%d\x1C%s\x1C%s\x1C%s\x1C%s\x1C%d\x1C%d\x1C%s\x1C",
                   current->id, current->name, current->region, current->address,
                   current->legal_person, current->size, current->contact_level, current->email);

            for (int i = 0; i < current->phone_count; i++)
                printf("%s%s", current->phones[i], (i == current->phone_count - 1) ? "" : "\x1D");

            printf("\x1C");

            for (int i = 0; i < current->contact_count; i++)
            {
                Contact *c = &current->contacts[i];
                printf("%d\x1E%s\x1E%s\x1E%d\x1E%d\x1E%d\x1E%s\x1E",
                       c->id, c->name, c->gender, c->birth_year, c->birth_month, c->birth_day, c->email);

                for (int j = 0; j < c->phone_count; j++)
                    printf("%s%s", c->phones[j], (j == c->phone_count - 1) ? "" : "\x1F");

                if (i < current->contact_count - 1)
                    printf("\x1D");
            }
            printf("\n");
        }
        current = current->next;
    }
    printf("%d\n", match_count);
}

void displayClientIdsAndNames(Client *head)
{
    Client *current = head;
    while (current)
    {
        printf("%d\x1D%s", current->id, current->name);
        if (current->next)
            printf("\x1C");
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
                printf("%d\x1D%s", contact->id, contact->name);
                if (i < current->contact_count - 1)
                    printf("\x1C");
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