#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include "../include/utils.h"
#include "../include/communication_manager.h"

Communication *parseCommunicationFromString(char *inputString, bool newID)
{
    if (!inputString || strlen(inputString) == 0)
    {
        return NULL;
    }
    Communication *newComm = (Communication *)malloc(sizeof(Communication));
    if (!newComm)
    {
        return NULL;
    }
    memset(newComm, 0, sizeof(Communication));
    char idStr[50] = {0};
    int scanned = sscanf(inputString, "%[^;];%d;%d;%d;%d;%d;%d;%d;%d;%d;%d;%[^\n]", idStr, &newComm->client_id, &newComm->contact_id, &newComm->sales_id, &newComm->year, &newComm->month, &newComm->day, &newComm->hour, &newComm->minute, &newComm->second, &newComm->duration, newComm->content);
    if (scanned < 12)
    {
        free(newComm);
        return NULL;
    }
    newComm->id = newID ? uidGenerate() : stoi(idStr);
    newComm->next = NULL;
    return newComm;
}

Communication *addCommunication(Communication *head, Communication *newCommunication)
{
    if (newCommunication == NULL)
        return head;
    if (head != NULL)
    {
        Communication *current = head;
        while (current->next != NULL)
            current = current->next;
        current->next = newCommunication;
    }
    else
        head = newCommunication;
    return head;
}

Communication *modifyCommunication(Communication *head, Communication *newCommunication)
{
    if (head == NULL)
        return newCommunication;
    Communication *current = head;
    Communication *prev = NULL;
    while (current != NULL)
    {
        if (current->id == newCommunication->id)
        {
            if (current == head)
            {
                newCommunication->next = current->next;
                free(current);
                return newCommunication;
            }
            else
            {
                prev->next = newCommunication;
                newCommunication->next = current->next;
                free(current);
                return head;
            }
        }
        prev = current;
        current = current->next;
    }
    return head;
}

int cmpCommunication(Communication *a, Communication *b, int num)
{
    switch (num)
    {
    case 1:
        return a->id - b->id;
    case 2:
        return a->client_id - b->client_id;
    case 3:
        return a->contact_id - b->contact_id;
    case 4:
        return a->sales_id - b->sales_id;
    case 5:
        return a->year - b->year;
    case 6:
        return a->month - b->month;
    case 7:
        return a->day - b->day;
    case 8:
        return a->hour - b->hour;
    case 9:
        return a->minute - b->minute;
    case 10:
        return a->second - b->second;
    case 11:
        return a->duration - b->duration;
    case -1:
        return a->id - b->id;
    case -2:
        return b->client_id - a->client_id;
    case -3:
        return b->contact_id - a->contact_id;
    case -4:
        return b->sales_id - a->sales_id;
    case -5:
        return b->year - a->year;
    case -6:
        return b->month - a->month;
    case -7:
        return b->day - a->day;
    case -8:
        return b->hour - a->hour;
    case -9:
        return b->minute - a->minute;
    case -10:
        return b->second - a->second;
    case -11:
        return b->duration - a->duration;
    default:
        return 0;
    }
}

Communication *mergeCommunicationSortedLists(Communication *list1, Communication *list2, int cnt, int a[])
{
    if (!list1)
        return list2;
    if (!list2)
        return list1;
    Communication *sortedList = NULL;
    for (int i = 0; i < cnt; i++)
    {
        if (cmpCommunication(list1, list2, a[i]) < 0)
        {
            sortedList = list1;
            sortedList->next = mergeCommunicationSortedLists(list1->next, list2, cnt, a);
            break;
        }
        else if (cmpCommunication(list1, list2, a[i]) > 0)
        {
            sortedList = list2;
            sortedList->next = mergeCommunicationSortedLists(list1, list2->next, cnt, a);
            break;
        }
    }
    if (!sortedList)
    {
        sortedList = list1;
        sortedList->next = mergeCommunicationSortedLists(list1->next, list2, cnt, a);
    }
    return sortedList;
}

void splitCommunicationList(Communication *head, Communication **front, Communication **back)
{
    Communication *slow = head;
    Communication *fast = head->next;
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

Communication *mergeSortCommunication(Communication *head, int cnt, int a[])
{
    if (!head || !head->next)
        return head;
    Communication *front = NULL;
    Communication *back = NULL;
    splitCommunicationList(head, &front, &back);
    front = mergeSortCommunication(front, cnt, a);
    back = mergeSortCommunication(back, cnt, a);
    return mergeCommunicationSortedLists(front, back, cnt, a);
}

void displayCommunication(Communication *head, int argc, char *argv[])
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
        a[i] = atoi(argv[3 + i]);
    head = mergeSortCommunication(head, cnt, a);
    char pattern[10000] = "";
    strcat(pattern, argv[2]);
    toLower(pattern);
    Communication *current = head;
    char text[15000];
    char tmp[200];
    while (current)
    {
        char text[10000] = "";
        char tmp[50] = "";
        snprintf(tmp, sizeof(tmp), "%d", current->id);
        strcat(text, tmp);
        snprintf(tmp, sizeof(tmp), "%d", current->client_id);
        strcat(text, tmp);
        snprintf(tmp, sizeof(tmp), "%d", current->contact_id);
        strcat(text, tmp);
        snprintf(tmp, sizeof(tmp), "%d", current->sales_id);
        strcat(text, tmp);
        snprintf(tmp, sizeof(tmp), "%d", current->year);
        strcat(text, tmp);
        snprintf(tmp, sizeof(tmp), "%d", current->month);
        strcat(text, tmp);
        snprintf(tmp, sizeof(tmp), "%d", current->day);
        strcat(text, tmp);
        snprintf(tmp, sizeof(tmp), "%d", current->hour);
        strcat(text, tmp);
        snprintf(tmp, sizeof(tmp), "%d", current->minute);
        strcat(text, tmp);
        snprintf(tmp, sizeof(tmp), "%d", current->second);
        strcat(text, tmp);
        snprintf(tmp, sizeof(tmp), "%d", current->duration);
        strcat(text, tmp);
        strcat(text, current->content);
        toLower(text);
        if (strlen(pattern) == 0 || kmp(text, pattern) >= 0)
        {
            printf("%d;%d;%d;%d;%d;%d;%d;%d;%d;%d;%s;", current->id, current->client_id, current->contact_id, current->sales_id, current->year, current->month, current->day, current->hour, current->minute, current->second, current->content);
            printf("\n");
        }
        current = current->next;
    }
}