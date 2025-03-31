#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include "file_manager.h"
#include "client_manager.h"
#include "user_manager.h"

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
        return -1;

    User *current = head;
    while (current)
    {
        fprintf(fp, "%d;%s;%s;%s\n", current->id, current->username, current->password_hash, current->role);
        current = current->next;
    }

    fclose(fp);
    return 0;
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
            fprintf(fp, "%s=%s=%d=%d=%d=%s=", contact->name, contact->gender, contact->birth_year, contact->birth_month, contact->birth_day, contact->email);

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

// -----  联络员数据文件操作 -----
Contact *loadContactsFromFile(const char *filename)
{
    // printf("file_manager: loadContactsFromFile - 功能待实现\n");
    return NULL;
}

int saveContactsToFile(const char *filename, Contact *head)
{
    // printf("file_manager: saveContactsToFile - 功能待实现\n");
    return 0;
}

// -----  业务员数据文件操作 -----
Sales *loadSalesFromFile(const char *filename)
{
    // printf("file_manager: loadEmployeesFromFile - 功能待实现\n");
    return NULL;
}

int saveSalesToFile(const char *filename, Sales *head)
{
    // printf("file_manager: saveEmployeesToFile - 功能待实现\n");
    return 0;
}

// -----  通信记录数据文件操作 -----
CommunicationRecord *loadCommunicationsFromFile(const char *filename)
{
    // printf("file_manager: loadCommunicationsFromFile - 功能待实现\n");
    return NULL;
}

int saveCommunicationsToFile(const char *filename, CommunicationRecord *head)
{
    // printf("file_manager: saveCommunicationsToFile - 功能待实现\n");
    return 0;
}

// -----  客户分组数据文件操作 -----
Group *loadGroupsFromFile(const char *filename)
{
    // printf("file_manager: loadGroupsFromFile - 功能待实现\n");
    return NULL;
}

int saveGroupsToFile(const char *filename, Group *head)
{
    // printf("file_manager: saveGroupsToFile - 功能待实现\n");
    return 0;
}