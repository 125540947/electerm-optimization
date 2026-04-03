# electerm-web Dockerfile
FROM node:22-alpine

# 安装依赖
RUN apk add --no-cache \
    git \
    curl \
    openssh-client

# 创建应用目录
WORKDIR /app

# 复制配置文件
COPY package.json ./

# 安装 Node 依赖
RUN npm install -g pm2

# 复制应用
COPY . .

# 构建
RUN npm run build

# 暴露端口
EXPOSE 5580 3000

# 启动命令
CMD ["sh", "-c", "pm2-runtime start ecosystem.config.js"]
