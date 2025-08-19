export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS配置
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // 验证用户令牌，返回用户ID
    async function getUserId() {
        const token = request.headers.get('Authorization');
        if (!token) return null;
        
        try {
            const user = await env.DB.prepare(
                'SELECT id FROM users WHERE token = ?'
            ).bind(token).first();
            return user?.id;
        } catch (e) {
            return null;
        }
    }

    // 路由处理
    switch (path) {
        // 用户注册
        case '/api/register': {
            if (request.method !== 'POST') {
                return new Response(JSON.stringify({ error: '方法不允许' }), { 
                    status: 405, 
                    headers: corsHeaders 
                });
            }

            try {
                const { username, password } = await request.json();
                
                // 简单验证
                if (!username || !password || username.length < 3 || password.length < 6) {
                    return new Response(JSON.stringify({ error: '用户名或密码不符合要求' }), { 
                        status: 400, 
                        headers: corsHeaders 
                    });
                }

                // 生成随机令牌
                const token = crypto.randomUUID();
                
                // 插入数据库
                await env.DB.prepare(`
                    INSERT INTO users (username, password, token) 
                    VALUES (?, ?, ?)
                `).bind(username, password, token).run();
                
                return new Response(JSON.stringify({ success: true }), { 
                    headers: corsHeaders 
                });
            } catch (e) {
                // 捕获唯一约束错误（用户名已存在）
                return new Response(JSON.stringify({ error: '用户名已存在' }), { 
                    status: 409, 
                    headers: corsHeaders 
                });
            }
        }

        // 用户登录
        case '/api/login': {
            if (request.method !== 'POST') {
                return new Response(JSON.stringify({ error: '方法不允许' }), { 
                    status: 405, 
                    headers: corsHeaders 
                });
            }

            try {
                const { username, password } = await request.json();
                
                // 查询用户
                const user = await env.DB.prepare(`
                    SELECT token FROM users 
                    WHERE username = ? AND password = ?
                `).bind(username, password).first();
                
                if (user) {
                    return new Response(JSON.stringify(user), { headers: corsHeaders });
                } else {
                    return new Response(JSON.stringify({ error: '认证失败' }), { 
                        status: 401, 
                        headers: corsHeaders 
                    });
                }
            } catch (e) {
                return new Response(JSON.stringify({ error: '登录失败' }), { 
                    status: 500, 
                    headers: corsHeaders 
                });
            }
        }

        // 获取当前用户信息
        case '/api/me': {
            if (request.method !== 'GET') {
                return new Response(JSON.stringify({ error: '方法不允许' }), { 
                    status: 405, 
                    headers: corsHeaders 
                });
            }

            const userId = await getUserId();
            if (!userId) {
                return new Response(JSON.stringify({ error: '未授权' }), { 
                    status: 401, 
                    headers: corsHeaders 
                });
            }

            try {
                const user = await env.DB.prepare(
                    'SELECT id, username FROM users WHERE id = ?'
                ).bind(userId).first();
                
                return new Response(JSON.stringify(user), { headers: corsHeaders });
            } catch (e) {
                return new Response(JSON.stringify({ error: '获取用户信息失败' }), { 
                    status: 500, 
                    headers: corsHeaders 
                });
            }
        }

        // 接口管理（列表、添加、删除）
        case '/api/apis': {
            const userId = await getUserId();
            if (!userId) {
                return new Response(JSON.stringify({ error: '未授权' }), { 
                    status: 401, 
                    headers: corsHeaders 
                });
            }

            // 获取接口列表
            if (request.method === 'GET') {
                try {
                    const apis = await env.DB.prepare(
                        'SELECT id, name, url, created_at FROM apis WHERE user_id = ? ORDER BY created_at DESC'
                    ).bind(userId).all();
                    
                    return new Response(JSON.stringify(apis.results), { headers: corsHeaders });
                } catch (e) {
                    return new Response(JSON.stringify({ error: '获取接口列表失败' }), { 
                        status: 500, 
                        headers: corsHeaders 
                    });
                }
            }

            // 添加接口
            if (request.method === 'POST') {
                try {
                    const { name, url } = await request.json();
                    
                    if (!name || !url) {
                        return new Response(JSON.stringify({ error: '名称和URL不能为空' }), { 
                            status: 400, 
                            headers: corsHeaders 
                        });
                    }

                    await env.DB.prepare(
                        'INSERT INTO apis (user_id, name, url) VALUES (?, ?, ?)'
                    ).bind(userId, name, url).run();
                    
                    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
                } catch (e) {
                    return new Response(JSON.stringify({ error: '添加接口失败' }), { 
                        status: 500, 
                        headers: corsHeaders 
                    });
                }
            }

            // 删除接口
            if (request.method === 'DELETE') {
                try {
                    const id = url.searchParams.get('id');
                    if (!id) {
                        return new Response(JSON.stringify({ error: '缺少接口ID' }), { 
                            status: 400, 
                            headers: corsHeaders 
                        });
                    }

                    await env.DB.prepare(
                        'DELETE FROM apis WHERE id = ? AND user_id = ?'
                    ).bind(id, userId).run();
                    
                    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
                } catch (e) {
                    return new Response(JSON.stringify({ error: '删除接口失败' }), { 
                        status: 500, 
                        headers: corsHeaders 
                    });
                }
            }

            return new Response(JSON.stringify({ error: '方法不允许' }), { 
                status: 405, 
                headers: corsHeaders 
            });
        }

        // 生成聚合JSON
        case '/api/json': {
            if (request.method !== 'GET') {
                return new Response(JSON.stringify({ error: '方法不允许' }), { 
                    status: 405, 
                    headers: corsHeaders 
                });
            }

            const userId = url.searchParams.get('user');
            if (!userId) {
                return new Response(JSON.stringify({ error: '缺少用户ID' }), { 
                    status: 400, 
                    headers: corsHeaders 
                });
            }

            try {
                const apis = await env.DB.prepare(
                    'SELECT name, url FROM apis WHERE user_id = ?'
                ).bind(userId).all();
                
                const jsonData = {
                    name: '聚合接口列表',
                    type: 'list',
                    data: apis.results.map(api => ({
                        name: api.name,
                        url: api.url
                    }))
                };
                
                return new Response(JSON.stringify(jsonData), { headers: corsHeaders });
            } catch (e) {
                return new Response(JSON.stringify({ error: '生成JSON失败' }), { 
                    status: 500, 
                    headers: corsHeaders 
                });
            }
        }

        // 未找到的路径
        default:
            return new Response(JSON.stringify({ error: '未找到' }), { 
                status: 404, 
                headers: corsHeaders 
            });
    }
}
    
