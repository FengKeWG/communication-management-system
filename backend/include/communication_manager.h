#ifndef Communication_MANAGER_H
#define Communication_MANAGER_H

#include "Communication.h"

Communication *parseCommunicationFromString(char *inputString, bool newID);
Communication *addCommunication(Communication *head, Communication *newCommunication);
Communication *modifyCommunication(Communication *head, Communication *newCommunication);
void displayCommunication(Communication *head, const char *pattern, int *sortKeys, int sortKeyCount, int filter_sales_id, const char *searchClientId, const char *searchContactId, const char *searchSalesId, const char *searchDuration, const char *searchContent);
Communication *mergeCommunicationSortedLists(Communication *list1, Communication *list2, int cnt, int a[]);
Communication *mergeSortCommunication(Communication *head, int cnt, int a[]);

#endif