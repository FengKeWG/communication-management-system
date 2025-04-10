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
    {
        fprintf(stderr, "读取用户文件失败");
        return NULL;
    }
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
        fprintf(stderr, "读取用户文件失败");
        return -1;
    }
    User *current = head;
    while (current)
    {
        fprintf(fp, "%d\x1C%s\x1C%s\x1C%s\x1C%d\n", current->id, current->username, current->password_hash, current->role, current->sales_id);
        current = current->next;
    }
    fclose(fp);
    return 0;
}

Client *loadClientsFromFile(const char *filename)
{
    FILE *fp = fopen(filename, "r");
    if (!fp)
    {
        fprintf(stderr, "读取客户文件失败");
        return NULL;
    }
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
    {
        fprintf(stderr, "读取客户文件失败");
        return -1;
    }
    Client *current = head;
    while (current)
    {
        fprintf(fp, "%d\x1C%s\x1C%s\x1C%s\x1C%s\x1C%d\x1C%d\x1C%s\x1C", current->id, current->name, current->region, current->address, current->legal_person, current->size, current->contact_level, current->email);
        for (int i = 0; i < current->phone_count; i++)
        {
            fprintf(fp, "%s", current->phones[i]);
            if (i < current->phone_count - 1)
                fprintf(fp, "\x1D");
        }
        fprintf(fp, "\x1C");
        for (int i = 0; i < current->contact_count; i++)
        {
            Contact *contact = &current->contacts[i];
            fprintf(fp, "%d\x1E%s\x1E%s\x1E%d\x1E%d\x1E%d\x1E%s\x1E", contact->id, contact->name, contact->gender, contact->birth_year, contact->birth_month, contact->birth_day, contact->email);

            for (int j = 0; j < contact->phone_count; j++)
            {
                fprintf(fp, "%s", contact->phones[j]);
                if (j < contact->phone_count - 1)
                    fprintf(fp, "\x1F");
            }
            if (i < current->contact_count - 1)
                fprintf(fp, "\x1D");
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
    {
        fprintf(stderr, "读取业务员文件失败");
        return NULL;
    }
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
    FILE *fp = fopen(filename, "w");
    if (!fp)
    {
        fprintf(stderr, "读取业务员文件失败");
        return -1;
    }
    Sales *current = head;
    while (current)
    {
        fprintf(fp, "%d\x1C%s\x1C%s\x1C%d\x1C%d\x1C%d\x1C%s\x1C", current->id, current->name, current->gender, current->birth_year, current->birth_month, current->birth_day, current->email);
        for (int i = 0; i < current->phone_count; i++)
            fprintf(fp, "%s%s", current->phones[i], (i < current->phone_count - 1) ? "\x1D" : "");
        fprintf(fp, "\x1C");
        for (int i = 0; i < current->client_count; i++)
            fprintf(fp, "%d%s", current->client_ids[i], (i < current->client_count - 1) ? "\x1D" : "");
        fprintf(fp, "\n");
        current = current->next;
    }
    fclose(fp);
    return 0;
}

Communication *loadCommunicationsFromFile(const char *filename)
{
    FILE *fp = fopen(filename, "r");
    if (!fp)
    {
        fprintf(stderr, "读取通信记录文件失败");
        return NULL;
    }
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
        fprintf(stderr, "读取通信记录文件失败");
        return -1;
    }
    Communication *current = head;
    while (current)
    {
        fprintf(fp, "%d\x1C%d\x1C%d\x1C%d\x1C%d\x1C%d\x1C%d\x1C%d\x1C%d\x1C%d\x1C%d\x1C%s\n", current->id, current->client_id, current->contact_id, current->sales_id, current->year, current->month, current->day, current->hour, current->minute, current->second, current->duration, current->content);
        current = current->next;
    }
    fclose(fp);
    return 0;
}

Group *loadGroupsFromFile(const char *filename)
{
    FILE *fp = fopen(filename, "r");
    if (!fp)
    {
        fprintf(stderr, "读取分组文件失败");
        return NULL;
    }
    Group *head = NULL, *tail = NULL;
    char line[10000];
    while (fgets(line, sizeof(line), fp))
    {
        if (line[0] == '\n' || line[0] == '\0')
            continue;
        Group *newGroup = parseGroupFromString(line, false);
        if (!newGroup)
            continue;
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

int saveGroupsToFile(const char *filename, Group *head)
{
    FILE *fp = fopen(filename, "w");
    if (!fp)
    {
        fprintf(stderr, "读取分组文件失败");
        return -1;
    }
    Group *current = head;
    while (current)
    {
        fprintf(fp, "%d\x1C%s\x1C", current->id, current->name);
        for (int i = 0; i < current->client_count; i++)
        {
            fprintf(fp, "%d", current->client_ids[i]);
            if (i < current->client_count - 1)
                fprintf(fp, "\x1D");
        }
        fprintf(fp, "\n");
        current = current->next;
    }
    fclose(fp);
    return 0;
}