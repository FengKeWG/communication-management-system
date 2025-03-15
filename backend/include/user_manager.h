#ifndef USER_MANAGER_H
#define USER_MANAGER_H

#include "user.h"

User *authenticateUser(User *userList, const char *username, const char *password);
User *addUser(User *head, User *newUser);
User *parseUserFromArgs(int argc, char *argv[]);

#endif