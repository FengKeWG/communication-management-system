#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include "file_manager.h"
#include "client_manager.h"
#include "user_manager.h"
#include "sales_manager.h"
#include "communication_manager.h"
#include "group_manager.h"

User *loadUsersFromFile(const char *filename)
{

    FILE *fp = fopen(filename, "r");
    if (!fp)
        return NULL;
    User *head = NULL, *tail = NULL;
    char line[1024];
    while (fgets(line, sizeof(line), fp))
    {
        if (line[0] == '\n')
            continue;
        User *newUser = parseUserFromString(line, false, false);
        if (!newUser)
            continue;
        newUser->next = NULL;
        if (head)
        {
            tail->next = newUser;
            tail = newUser;
        }
        else
        {
            head = newUser;
            tail = newUser;
        }
    }
    fclose(fp);
    return head;
}

int saveUsersToFile(const char *filename, User *head)
{
    FILE *fp = fopen(filename, "w");
    if (!fp)
    {
        perror("错误：无法打开用户文件进行写入"); // 提供更详细的错误信息
        return -1;
    }
    User *current = head;
    while (current)
    {
        // **在格式字符串末尾添加 ";%d" 并传递 current->sales_id**
        int written = fprintf(fp, "%d;%s;%s;%s;%d\n", // <-- 添加 ;%d
                              current->id,
                              current->username,
                              current->password_hash, // 密码哈希应该被保存
                              current->role,
                              current->sales_id); // <-- 添加 sales_id
        if (written < 0)
        {
            perror("错误：写入用户数据失败");
            fclose(fp);
            return -1; // 写入失败
        }
        current = current->next;
    }
    if (fclose(fp) != 0)
    {
        perror("错误：关闭用户文件失败");
        return -1; // 关闭失败
    }
    return 0; // 成功
}

Client *loadClientsFromFile(const char *filename)
{
    FILE *fp = fopen(filename, "r");
    if (!fp)
        return NULL;
    Client *head = NULL, *tail = NULL;
    char line[8192];
    while (fgets(line, sizeof(line), fp))
    {
        if (line[0] == '\n' || line[0] == '\0')
            continue;
        Client *newClient = parseClientFromString(line, false);
        newClient->next = NULL;
        if (!newClient)
            continue;
        if (head)
        {
            tail->next = newClient;
            tail = newClient;
        }
        else
        {
            head = newClient;
            tail = newClient;
        }
    }
    fclose(fp);
    return head;
}

int saveClientsToFile(const char *filename, Client *head)
{
    FILE *fp = fopen(filename, "w");
    if (!fp)
        return -1;
    Client *current = head;
    while (current)
    {
        fprintf(fp, "%d;%s;%s;%s;%s;%d;%d;%s;", current->id, current->name, current->region, current->address, current->legal_person, current->size, current->contact_level, current->email);
        for (int i = 0; i < current->phone_count; i++)
        {
            fprintf(fp, "%s", current->phones[i]);
            if (i < current->phone_count - 1)
                fprintf(fp, ",");
        }
        fprintf(fp, ";");
        for (int i = 0; i < current->contact_count; i++)
        {
            Contact *contact = &current->contacts[i];
            fprintf(fp, "%s=%d=%d=%d=%d=%s=", contact->name, contact->gender, contact->birth_year, contact->birth_month, contact->birth_day, contact->email);
            for (int j = 0; j < contact->phone_count; j++)
            {
                fprintf(fp, "%s", contact->phones[j]);
                if (j < contact->phone_count - 1)
                    fprintf(fp, "~");
            }
            if (i < current->contact_count - 1)
                fprintf(fp, ",");
        }
        fprintf(fp, "\n");
        current = current->next;
    }
    fclose(fp);
    return 0;
}

Sales *loadSalesFromFile(const char *filename)
{
    FILE *fp = fopen(filename, "r");
    if (!fp)
        return NULL;
    Sales *head = NULL, *tail = NULL;
    char line[1024];
    while (fgets(line, sizeof(line), fp))
    {
        if (line[0] == '\n')
            continue;
        Sales *newSales = parseSalesFromString(line, false);
        if (!newSales)
            continue;
        newSales->next = NULL;
        if (head)
        {
            tail->next = newSales;
            tail = newSales;
        }
        else
        {
            head = newSales;
            tail = newSales;
        }
    }
    fclose(fp);
    return head;
}

int saveSalesToFile(const char *filename, Sales *head)
{
    FILE *file = fopen(filename, "w");
    if (!file)
        return 1;
    Sales *current = head;
    while (current)
    {
        fprintf(file, "%d;%s;%s;%d;%d;%d;%s;", current->id, current->name, current->gender, current->birth_year, current->birth_month, current->birth_day, current->email);
        for (int i = 0; i < current->phone_count; i++)
            fprintf(file, "%s%s", current->phones[i], (i < current->phone_count - 1) ? "," : "");
        fprintf(file, ";");
        for (int i = 0; i < current->client_count; i++)
            fprintf(file, "%d%s", current->client_ids[i], (i < current->client_count - 1) ? "," : "");
        fprintf(file, "\n");
        current = current->next;
    }
    fclose(file);
    return 0;
}

Communication *loadCommunicationsFromFile(const char *filename)
{
    FILE *fp = fopen(filename, "r");
    if (!fp)
        return NULL;
    Communication *head = NULL, *tail = NULL;
    char line[2048];
    while (fgets(line, sizeof(line), fp))
    {
        if (line[0] == '\n' || line[0] == '\0')
            continue;
        Communication *newComm = parseCommunicationFromString(line, false);
        if (!newComm)
            continue;
        newComm->next = NULL;
        if (head)
        {
            tail->next = newComm;
            tail = newComm;
        }
        else
        {
            head = newComm;
            tail = newComm;
        }
    }
    fclose(fp);
    return head;
}

int saveCommunicationsToFile(const char *filename, Communication *head)
{
    FILE *fp = fopen(filename, "w");
    if (!fp)
    {
        return -1;
    }
    Communication *current = head;
    while (current)
    {
        fprintf(fp, "%d;%d;%d;%d;%d;%d;%d;%d;%d;%d;%d;%s\n", current->id, current->client_id, current->contact_id, current->sales_id, current->year, current->month, current->day, current->hour, current->minute, current->second, current->duration, current->content);
        current = current->next;
    }
    fclose(fp);
    return 0;
}

Group *loadGroupsFromFile(const char *filename)
{
    FILE *fp = fopen(filename, "r");
    if (!fp)
        return NULL; // 文件不存在或无法打开，返回空

    Group *head = NULL, *tail = NULL;
    char line[10000]; // 分配足够大的缓冲区

    while (fgets(line, sizeof(line), fp))
    {
        // 移除可能的换行符
        line[strcspn(line, "\n")] = 0;
        if (strlen(line) == 0 || line[0] == ';')
            continue; // 跳过空行或无效行

        Group *newGroup = parseGroupFromString(line, false); // 使用 false 表示从文件加载，ID 已存在
        if (!newGroup)
        {
            fprintf(stderr, "警告: 解析分组文件行失败: %s\n", line);
            continue; // 解析失败，跳过此行
        }

        newGroup->next = NULL;
        if (!head)
        {
            head = newGroup;
            tail = newGroup;
        }
        else
        {
            tail->next = newGroup;
            tail = newGroup;
        }
    }

    fclose(fp);
    return head;
}

// 保存分组数据
int saveGroupsToFile(const char *filename, Group *head)
{
    FILE *fp = fopen(filename, "w");
    if (!fp)
    {
        return -1;
    }
    Group *current = head;
    while (current)
    {
        fprintf(fp, "%d;%s;", current->id, current->name);
        for (int i = 0; i < current->client_count; i++)
        {
            fprintf(fp, "%d", current->client_ids[i]);
            if (i < current->client_count - 1)
            {
                fprintf(fp, ",");
            }
        }
        fprintf(fp, "\n");
        current = current->next;
    }
    if (fclose(fp) != 0)
    {
        perror("错误：关闭分组文件失败");
        return -1;
    }
    return 0; // 成功
}