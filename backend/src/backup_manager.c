#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sys/stat.h>
#include <unistd.h>
#include <errno.h>
#include <windows.h> // Windows API支持
#include <direct.h>  // 用于_mkdir函数
#include "../include/backup_manager.h"
#include "../include/utils.h"

// Windows下mkdir的兼容性定义
#ifndef mkdir
#define mkdir(path) _mkdir(path)
#endif

// 内部辅助函数：比较备份文件名（用于按时间降序排序）
int compare_backup_files(const char *a, const char *b)
{
    // 简单的按文件名反向比较（假设文件名包含时间戳且格式一致）
    return strcmp(b, a);
}

const char *parse_and_format_backup_timestamp(const char *filename)
{
    // 静态缓冲区存储结果，每次调用会覆盖上次结果
    static char formatted_time[30];
    int year, month, day, hour, minute, second;
    size_t len = strlen(filename);

    // 检查基本格式和后缀
    // 文件名至少需要 "backup_YYYYMMDD_HHMMSS.zip" 的长度
    const char *expected_prefix = "backup_";
    const char *expected_suffix = ".zip";
    size_t prefix_len = strlen(expected_prefix);
    size_t suffix_len = strlen(expected_suffix);
    size_t expected_min_len = prefix_len + 8 /*YYYYMMDD*/ + 1 /*_*/ + 6 /*HHMMSS*/ + suffix_len;

    if (len < expected_min_len || strncmp(filename, expected_prefix, prefix_len) != 0 || strcmp(filename + len - suffix_len, expected_suffix) != 0)
    {
        strcpy(formatted_time, "格式错误");
        return formatted_time;
    }

    // 尝试从特定位置解析日期和时间数字
    // YYYYMMDD 在 prefix_len 之后
    // HHMMSS 在 prefix_len + 8 + 1 之后
    if (sscanf(filename + prefix_len, "%4d%2d%2d_%2d%2d%2d",
               &year, &month, &day, &hour, &minute, &second) == 6)
    {
        // 基本的有效性检查 (可以根据需要做得更严格)
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 &&
            hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59)
        {
            // 格式化为 "YYYY-MM-DD HH:MM:SS"
            sprintf(formatted_time, "%04d-%02d-%02d %02d:%02d:%02d",
                    year, month, day, hour, minute, second);
            return formatted_time;
        }
        else
        {
            strcpy(formatted_time, "日期无效"); // 解析出的数字范围不对
            return formatted_time;
        }
    }

    // 如果 sscanf 失败
    strcpy(formatted_time, "无法解析");
    return formatted_time;
}

int create_backup()
{
    time_t now = time(NULL);
    struct tm *t = localtime(&now);
    char timestamp[20]; // YYYYMMDD_HHMMSS
    strftime(timestamp, sizeof(timestamp), "%Y%m%d_%H%M%S", t);

    // 确保备份目录存在
    if (access("./backups", F_OK) == -1)
    {
        if (mkdir("./backups") != 0)
        {
            // 使用 perror 打印更具体的错误信息
            fprintf(stderr, "错误: 无法创建备份目录 './backups': %s\n", strerror(errno));
            return 1;
        }
    }

    char backup_filename[FILENAME_MAX];
    // *** 修改点 1: 文件扩展名改为 .zip ***
    snprintf(backup_filename, sizeof(backup_filename), ".\\backups\\backup_%s.zip", timestamp); // 使用反斜杠更符合Windows习惯

    // *** 修改点 2: 构建 PowerShell 命令 ***
    char command[PATH_MAX * 2];
    // 使用 powershell -Command "..." 执行命令
    // Compress-Archive:
    // -Path .\data\* : 指定要压缩的内容 (data 目录下的所有文件和子目录)
    // -DestinationPath '%s' : 指定输出的 zip 文件路径 (用单引号包裹以防路径问题)
    // -Force : 如果目标 zip 文件已存在，则覆盖它
    snprintf(command, sizeof(command),
             "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Compress-Archive -Path .\\data\\* -DestinationPath '%s' -Force\"",
             backup_filename);

    printf("信息: 执行备份命令: %s\n", command);
    fflush(stdout); // 确保信息先打印出来

    int result = system(command);

    if (result == 0)
    {
        printf("备份成功创建: %s\n", backup_filename);
        fflush(stdout);
        return 0;
    }
    else
    {
        // system 返回 -1 通常表示命令处理器无法启动，其他非零值是命令本身的退出码
        fprintf(stderr, "错误: 备份命令 (PowerShell Compress-Archive) 执行失败，返回码: %d\n", result);
        // 尝试删除可能不完整的备份文件
        if (access(backup_filename, F_OK) == 0)
        {
            remove(backup_filename);
        }
        return 1;
    }
}

int list_backups()
{
    WIN32_FIND_DATA findData;
    HANDLE hFind;
    char searchPath[MAX_PATH];
    int count = 0;

    // 确保backups目录存在 (代码不变)
    if (access("./backups", F_OK) == -1)
    {
        if (mkdir("./backups") != 0)
        {
            fprintf(stderr, "错误: 无法创建备份目录 './backups': %s\n", strerror(errno));
            return 1; // 返回错误码
        }
        // 即使刚创建了目录，下面查找也会返回找不到文件，是正常情况
    }

    snprintf(searchPath, MAX_PATH, ".\\backups\\backup_*.zip");

    hFind = FindFirstFile(searchPath, &findData);
    if (hFind == INVALID_HANDLE_VALUE)
    {
        if (GetLastError() == ERROR_FILE_NOT_FOUND)
        {
            // 没有找到匹配的文件，正常情况，直接返回成功，列表为空
            return 0;
        }
        // 其他错误
        fprintf(stderr, "错误: 查找备份文件失败: %lu\n", GetLastError());
        return 1; // 返回错误码
    }

    // (如果需要排序，逻辑会更复杂，需要先读取所有文件名到数组，排序，再遍历打印)
    // 当前实现：按找到的顺序列出

    do
    {
        // 跳过目录
        if (!(findData.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY))
        {
            // 调用辅助函数解析并格式化时间
            const char *formatted_timestamp = parse_and_format_backup_timestamp(findData.cFileName);

            // *** 输出格式修改：文件名和时间戳用 | 分隔 ***
            printf("%s|%s\n", findData.cFileName, formatted_timestamp);
            count++;
        }
    } while (FindNextFile(hFind, &findData));

    FindClose(hFind);

    fflush(stdout); // 确保所有输出都被发送
    return 0;       // 返回成功
}

int delete_backup(const char *backup_filename)
{
    if (backup_filename == NULL || strstr(backup_filename, "/") != NULL ||
        strstr(backup_filename, "\\") != NULL || strcmp(backup_filename, ".") == 0 ||
        strcmp(backup_filename, "..") == 0)
    {
        fprintf(stderr, "错误: 无效或不安全的备份文件名: %s\n", backup_filename ? backup_filename : "(null)");
        return 1;
    }

    char full_path[PATH_MAX];
    snprintf(full_path, sizeof(full_path), "%s/%s", "./backups", backup_filename);

    // 检查文件是否存在
    if (access(full_path, F_OK) == -1)
    {
        fprintf(stderr, "错误: 备份文件不存在: %s\n", full_path);
        return 1; // 文件不存在
    }

    if (remove(full_path) == 0)
    {
        printf("备份文件已删除: %s\n", backup_filename);
        fflush(stdout);
        return 0;
    }
    else
    {
        perror("错误: 删除备份文件失败");
        fprintf(stderr, "文件路径: %s\n", full_path);
        return 1;
    }
}

int restore_backup(const char *backup_filename)
{
    // 基本的文件名安全检查 (保持不变)
    if (backup_filename == NULL || strstr(backup_filename, "/") != NULL ||
        strstr(backup_filename, "\\") != NULL || strcmp(backup_filename, ".") == 0 ||
        strcmp(backup_filename, "..") == 0 ||
        // *** 修改点 4: 检查扩展名是否为 .zip ***
        (strlen(backup_filename) < 5 || strcmp(backup_filename + strlen(backup_filename) - 4, ".zip") != 0))
    {
        fprintf(stderr, "错误: 无效或不安全的备份文件名 (必须是 .zip 文件): %s\n", backup_filename ? backup_filename : "(null)");
        return 1;
    }

    char backup_filepath[PATH_MAX];
    snprintf(backup_filepath, sizeof(backup_filepath), ".\\backups\\%s", backup_filename);

    // 检查备份文件是否存在 (保持不变)
    if (access(backup_filepath, F_OK) == -1)
    {
        fprintf(stderr, "错误: 备份文件不存在: %s\n", backup_filepath);
        return 1;
    }

    // 确保数据目录存在 (保持不变)
    if (access("./data", F_OK) == -1)
    {
        if (mkdir("./data") != 0)
        {
            fprintf(stderr, "错误: 无法创建数据目录 './data': %s\n", strerror(errno));
            return 1;
        }
    }

    // 清空数据目录 (使用 Windows 的 `rd` 和 `md` 命令，比 `del /Q` 更彻底)
    char command[PATH_MAX * 2];
    // 先删除目录，忽略错误（如果目录不存在），再创建空目录
    snprintf(command, sizeof(command), "rd /s /q .\\data && md .\\data");
    printf("警告: 正在清空并重建数据目录 %s ... 命令: %s\n", "./data", command);
    fflush(stdout);
    int result = system(command);
    // rd 命令在目录不存在时会返回错误码，md 在目录已存在时也会，这里不严格检查 result
    // 主要目的是确保 data 目录是空的
    // 更好的方法是遍历删除目录内容，但 system 调用 rd/md 通常够用

    printf("信息: 数据目录 %s 已准备好进行恢复。\n", "./data");
    fflush(stdout);

    // *** 修改点 5: 使用 PowerShell Expand-Archive 解压 ***
    snprintf(command, sizeof(command),
             "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Expand-Archive -Path '%s' -DestinationPath .\\data -Force\"",
             backup_filepath);

    printf("信息: 执行恢复命令: %s\n", command);
    fflush(stdout);
    result = system(command);

    if (result == 0)
    {
        printf("从备份 %s 恢复成功。\n", backup_filename);
        fflush(stdout);
        return 0;
    }
    else
    {
        fprintf(stderr, "错误: 恢复命令 (PowerShell Expand-Archive) 执行失败，返回码: %d\n", result);
        // 恢复失败后，数据目录可能处于不一致状态
        return 1;
    }
}