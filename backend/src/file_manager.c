#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../include/file_manager.h"

// -----  客户数据文件操作 -----
Client *loadClientsFromFile(const char *filename)
{
    FILE *fp = fopen(filename, "r");
    if (fp == NULL)
    {
        perror("读取文件错误！");
        return NULL;
    }
    Client *head = NULL;
    Client *tail = NULL;
    char line[1024];
    while (fgets(line, sizeof(line), fp) != NULL)
    {
        if (line[0] == '\n' || line[0] == '#')
        {
            continue;
        }
        Client *newClient = (Client *)malloc(sizeof(Client));
        if (newClient == NULL)
        {
            perror("内存分配失败！");
            fclose(fp);
            return NULL;
        }
        memset(newClient, 0, sizeof(Client));
        char *token;
        char *rest = line;
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            newClient->id = atoi(token);
        }
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            strncpy(newClient->name, token, sizeof(newClient->name) - 1);
            newClient->name[sizeof(newClient->name) - 1] = '\0';
        }
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            strncpy(newClient->region, token, sizeof(newClient->region) - 1);
            newClient->region[sizeof(newClient->region) - 1] = '\0';
        }
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            strncpy(newClient->address, token, sizeof(newClient->address) - 1);
            newClient->address[sizeof(newClient->address) - 1] = '\0';
        }
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            strncpy(newClient->legal_person, token, sizeof(newClient->legal_person) - 1);
            newClient->legal_person[sizeof(newClient->legal_person) - 1] = '\0';
        }
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            newClient->size = atoi(token);
        }
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            newClient->contact_level = atoi(token);
        }
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            strncpy(newClient->email, token, sizeof(newClient->email) - 1);
            newClient->email[sizeof(newClient->email) - 1] = '\0';
        }
        token = strtok_r(rest, ",", &rest);
        if (token != NULL)
        {
            char *phone_token;
            char *phone_rest = token;
            newClient->phone_count = 0;
            while ((phone_token = strtok_r(phone_rest, ";", &phone_rest)) != NULL && newClient->phone_count < 100)
            {
                strncpy(newClient->phones[newClient->phone_count], phone_token, sizeof(newClient->phones[newClient->phone_count]) - 1);
                newClient->phones[newClient->phone_count][sizeof(newClient->phones[newClient->phone_count]) - 1] = '\0';
                newClient->phone_count++;
            }
        }
        newClient->contact_count = 0;
        newClient->next = NULL;
        if (head == NULL)
        {
            head = newClient;
            tail = newClient;
        }
        else
        {
            tail->next = newClient;
            tail = newClient;
        }
    }
    fclose(fp);
    return head;
}

int saveClientsToFile(const char *filename, Client *head)
{
    FILE *fp = fopen(filename, "w");
    if (fp == NULL)
    {
        perror("写入文件错误！");
        return -1;
    }
    Client *current = head;
    while (current != NULL)
    {
        fprintf(fp, "%d,%s,%s,%s,%s,%d,%d,%s,",
                current->id, current->name, current->region, current->address,
                current->legal_person, current->size, current->contact_level,
                current->email);
        for (int i = 0; i < current->phone_count; i++)
        {
            fprintf(fp, "%s", current->phones[i]);
            if (i < current->phone_count - 1)
            {
                fprintf(fp, ";");
            }
        }
        fprintf(fp, "\n");
        current = current->next;
    }
    fclose(fp);
    return 0;
}

// -----  联络员数据文件操作 -----
Contact *loadContactsFromFile(const char *filename)
{
    printf("file_manager: loadContactsFromFile - 功能待实现\n");
    return NULL;
}

int saveContactsToFile(const char *filename, Contact *head)
{
    printf("file_manager: saveContactsToFile - 功能待实现\n");
    return 0;
}

// -----  业务员数据文件操作 -----
Employee *loadEmployeesFromFile(const char *filename)
{
    printf("file_manager: loadEmployeesFromFile - 功能待实现\n");
    return NULL;
}

int saveEmployeesToFile(const char *filename, Employee *head)
{
    printf("file_manager: saveEmployeesToFile - 功能待实现\n");
    return 0;
}

// -----  通信记录数据文件操作 -----
CommunicationRecord *loadCommunicationsFromFile(const char *filename)
{
    printf("file_manager: loadCommunicationsFromFile - 功能待实现\n");
    return NULL;
}

int saveCommunicationsToFile(const char *filename, CommunicationRecord *head)
{
    printf("file_manager: saveCommunicationsToFile - 功能待实现\n");
    return 0;
}

// -----  客户分组数据文件操作 -----
Group *loadGroupsFromFile(const char *filename)
{
    printf("file_manager: loadGroupsFromFile - 功能待实现\n");
    return NULL;
}

int saveGroupsToFile(const char *filename, Group *head)
{
    printf("file_manager: saveGroupsToFile - 功能待实现\n");
    return 0;
}