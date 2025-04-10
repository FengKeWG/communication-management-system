#ifndef USER_MANAGER_H
#define USER_MANAGER_H

#include "user.h"
#include "sales_manager.h"

User *authenticateUser(User *userList, char *username, char *password);
User *addUser(User *head, User *newUser);
User *parseUserFromString(char *userString, bool newID, bool hashPasswordOnParse);
User *deleteUser(User *head, int id);
void displayUsers(User *head, const char *pattern, int *sortKeys, int sortKeyCount);
User *modifyUser(User *head, User *updatedUser);
User *findUserById(User *head, int id);
int changeUserPassword(User *head, const char *username, const char *oldPassword, const char *newPassword, const char *confirmPassword);
int resetUserPassword(User *userList, const char *username, const char *newPassword);
int verifySalesIdentity(User *userList, Sales *salesList, const char *username, const char *name, int birth_year, int birth_month, int birth_day, const char *email);
char *getPasswordHashById(User *head, int id);
void freeUserList(User *head);

#endif