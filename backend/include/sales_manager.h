#ifndef SALES_MANAGER_H
#define SALES_MANAGER_H

#include "sales.h"
#include "utils.h"

Sales *parseSalesFromString(char *inputString, bool newID);
Sales *addSales(Sales *head, Sales *newClient);
Sales *deleteSales(Sales *head, int id);
Sales *modifySales(Sales *head, Sales *newClient);
void displaySales(Sales *head, int argc, char *argv[]);

#endif