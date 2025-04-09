#ifndef SALES_MANAGER_H
#define SALES_MANAGER_H

#include "sales.h"
#include "utils.h"
#include "user_manager.h"

Sales *parseSalesFromString(char *inputString, bool newID);
Sales *addSales(Sales *head, Sales *newClient);
Sales *deleteSales(Sales *head, int id);
Sales *modifySales(Sales *head, Sales *newClient);
void displaySales(Sales *head, const char *pattern, int *sortKeys, int sortKeyCount, const char *searchName, const char *searchEmail, const char *searchClientCount);
void displaySalesIdsAndNames(Sales *head);
void displayUnlinkedSales(Sales *salesHead, User *userHead);
Sales *findSalesById(Sales *head, int id);

#endif