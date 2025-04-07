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
        return NULL;
    }
    Client *newClient = (Client *)malloc(sizeof(Client));
    if (!newClient)
    {
        return NULL;
    }
    memset(newClient, 0, sizeof(Client));
    char idStr[50] = {0};
    char phonesStr[1024] = {0};
    char contactsStr[4096] = {0};
    int scanned = sscanf(inputString, "%[^;];%[^;];%[^;];%[^;];%[^;];%d;%d;%[^;];%[^;];%[^\n]", idStr, newClient->name, newClient->region, newClient->address, newClient->legal_person, &newClient->size, &newClient->contact_level, newClient->email, phonesStr, contactsStr);
    if (scanned < 9)
    {
        free(newClient);
        return NULL;
    }
    newClient->id = newID ? uidGenerate() : stoi(idStr);
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
            char contact_phones[1024] = {0};
            int contact_fields = sscanf(contact_str, "%[^=]=%[^=]=%d=%d=%d=%[^=]=%[^\n]", current_contact->name, current_contact->gender, &current_contact->birth_year, &current_contact->birth_month, &current_contact->birth_day, current_contact->email, contact_phones);
            if (strlen(current_contact->gender) == 0)
                strcpy(current_contact->gender, "未知");
            current_contact->phone_count = 0;
            if (contact_fields >= 7 && contact_phones[0] != '\0')
            {
                char *phone_num = strtok(contact_phones, "~");
                while (phone_num && current_contact->phone_count < 100)
                {
                    scpy(current_contact->phones[current_contact->phone_count], phone_num, sizeof(current_contact->phones[0]));
                    current_contact->phone_count++;
                    phone_num = strtok(NULL, "~");
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
    if (newClient == NULL)
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
    free(current);
    return head;
}

Client *modifyClient(Client *head, Client *newClient)
{
    if (head == NULL)
        return newClient;
    Client *current = head;
    Client *prev = NULL;
    while (current != NULL)
    {
        if (current->id == newClient->id)
        {
            if (current == head)
            {
                newClient->next = current->next;
                free(current);
                return newClient;
            }
            else
            {
                prev->next = newClient;
                newClient->next = current->next;
                free(current);
                return head;
            }
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

void displayClients(Client *head, int argc, char *argv[])
{
    if (argc < 3)
        return;
    if (argc == 3)
    {
        argc++;
        argv[3] = "1";
    }
    int cnt = argc - 3;
    int a[cnt];
    for (int i = 0; i < cnt; i++)
        a[i] = stoi(argv[3 + i]);
    head = mergeSortClient(head, cnt, a);
    char pattern[10000] = "";
    strcat(pattern, argv[2]);
    toLower(pattern);
    Client *current = head;
    char text[15000];
    char tmp[200];
    while (current)
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
        if (strlen(pattern) == 0 || kmp(text, pattern) >= 0)
        {
            printf("%d;%s;%s;%s;%s;%d;%d;%s;", current->id, current->name, current->region, current->address, current->legal_person, current->size, current->contact_level, current->email);
            for (int i = 0; i < current->phone_count; i++)
                printf("%s%s", current->phones[i], (i == current->phone_count - 1) ? "" : ",");
            printf(";");
            for (int i = 0; i < current->contact_count; i++)
            {
                Contact *c = &current->contacts[i];
                printf("%s=%s=%d=%d=%d=%s=", c->name, c->gender, c->birth_year, c->birth_month, c->birth_day, c->email);
                for (int j = 0; j < c->phone_count; j++)
                    printf("%s%s", c->phones[j], (j == c->phone_count - 1) ? "" : "~");
                if (i < current->contact_count - 1)
                    printf(",");
            }
            printf("\n");
        }
        current = current->next;
    }
    fflush(stdout);
}

void displayClientIdsAndNames(Client *head)
{
    Client *current = head;
    while (current != NULL)
    {
        printf("%d,%s", current->id, current->name);
        if (current->next)
            printf(";");
        current = current->next;
    }
    printf("\n");
}

void displayClientDetails(Client *head, int id)
{
    Client *current = head;
    while (current)
    {
        if (current->id == id)
        {
            printf("%d;%s;%s;%s;%s;%d;%d;%s;", current->id, current->name, current->region, current->address, current->legal_person, current->size, current->contact_level, current->email);
            for (int i = 0; i < current->phone_count; i++)
                printf("%s%s", current->phones[i], (i == current->phone_count - 1) ? "" : ",");
            printf(";");
            for (int i = 0; i < current->contact_count; i++)
            {
                Contact *c = &current->contacts[i];
                printf("%s=%s=%d=%d=%d=%s=", c->name, c->gender, c->birth_year, c->birth_month, c->birth_day, c->email);
                for (int j = 0; j < c->phone_count; j++)
                    printf("%s%s", c->phones[j], (j == c->phone_count - 1) ? "" : "~");
                if (i < current->contact_count - 1)
                    printf(",");
            }
            printf("\n");
            return;
        }
        current = current->next;
    }
}