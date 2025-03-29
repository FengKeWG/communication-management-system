#ifndef USER_MANAGER_H
#define USER_MANAGER_H

#include "user.h"

User *authenticateUser(User *userList, char *username, char *password);
User *addUser(User *head, User *newUser);
User *parseUserFromString(char *userString, bool newID, bool hash);

#endif