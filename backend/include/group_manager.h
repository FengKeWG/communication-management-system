#ifndef GROUP_MANAGER_H
#define GROUP_MANAGER_H

#include "group.h"
#include "utils.h"

Group *parseGroupFromString(char *inputString, bool newID);
Group *addGroup(Group *head, Group *newGroup);
Group *deleteGroup(Group *head, int id);
Group *modifyGroup(Group *head, Group *updatedGroup);
void displayGroups(Group *head, const char *pattern, int *sortKeys, int sortKeyCount, const char *searchName, const char *searchClientCount);
Group *findGroupById(Group *head, int id);
Group *mergeSortGroup(Group *head, int cnt, int a[]);
void freeGroupList(Group *head);

#endif