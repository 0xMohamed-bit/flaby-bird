        // تعريف المتغيرات الأساسية
        const gameContainer = document.getElementById('game-container');
        const bird = document.getElementById('bird');
        const scoreDisplay = document.getElementById('score-display');
        const levelDisplay = document.getElementById('level-display');
        const highScoreDisplay = document.getElementById('high-score');
        const lifeDisplay = document.getElementById('life-display');
        const startScreen = document.getElementById('start-screen');
        const gameOverScreen = document.getElementById('game-over');
        const finalScoreSpan = document.getElementById('final-score');
        const restartButton = document.getElementById('restart');
        const easyButton = document.getElementById('easy');
        const mediumButton = document.getElementById('medium');
        const hardButton = document.getElementById('hard');
        const powerBar = document.getElementById('power-level');
        const pauseButton = document.querySelector('.pause-btn');
        
        // الإعدادات الافتراضية للعبة
        let gameSettings = {
            gravity: 0.5,
            jumpForce: -10,
            pipeSpeed: 3,
            pipeFrequency: 1500,
            gapSize: 200,
            obstacleFrequency: 3000,
            coinFrequency: 2000
        };
        
        // متغيرات حالة اللعبة
        let birdPosition = 300;
        let birdVelocity = 0;
        let score = 0;
        let highScore = localStorage.getItem('flappyHighScore') || 0;
        let level = 1;
        let lives = 3;
        let gameActive = false;
        let pipes = [];
        let obstacles = [];
        let coins = [];
        let clouds = [];
        let lastPipeTime = 0;
        let lastObstacleTime = 0;
        let lastCoinTime = 0;
        let powerLevel = 0;
        let powerActive = false;
        let gameLoopId;
        let isPaused = false;
        let previousTime = 0;
        let frameCount = 0;
        
        // تحديث عرض النقاط العالية
        highScoreDisplay.textContent = `أعلى نتيجة: ${highScore}`;
        
        // إضافة مستمعي الأحداث للأزرار
        easyButton.addEventListener('click', () => startGame('easy'));
        mediumButton.addEventListener('click', () => startGame('medium'));
        hardButton.addEventListener('click', () => startGame('hard'));
        restartButton.addEventListener('click', resetGame);
        pauseButton.addEventListener('click', togglePause);
        
        // إضافة مستمعي الأحداث للعبة
        document.addEventListener('keydown', handleKeyDown);
        gameContainer.addEventListener('click', handleClick);
        document.addEventListener('keyup', handleKeyUp);
        
        // دالة بدء اللعبة
        function startGame(difficulty) {
            // تعيين إعدادات اللعبة بناءً على مستوى الصعوبة
            switch (difficulty) {
                case 'easy':
                    gameSettings = {
                        gravity: 0.4,
                        jumpForce: -9,
                        pipeSpeed: 2.5,
                        pipeFrequency: 2000,
                        gapSize: 200,
                        obstacleFrequency: 4000,
                        coinFrequency: 1500
                    };
                    break;
                case 'medium':
                    gameSettings = {
                        gravity: 0.5,
                        jumpForce: -10,
                        pipeSpeed: 3,
                        pipeFrequency: 1500,
                        gapSize: 180,
                        obstacleFrequency: 3000,
                        coinFrequency: 2000
                    };
                    break;
                case 'hard':
                    gameSettings = {
                        gravity: 0.6,
                        jumpForce: -11,
                        pipeSpeed: 4,
                        pipeFrequency: 1200,
                        gapSize: 160,
                        obstacleFrequency: 2000,
                        coinFrequency: 2500
                    };
                    break;
            }
            
            // إخفاء شاشة البداية وبدء اللعبة
            startScreen.style.display = 'none';
            gameActive = true;
            
            // إضافة بعض الغيوم
            createInitialClouds();
            
            // بدء حلقة اللعبة
            previousTime = performance.now();
            gameLoopId = requestAnimationFrame(gameLoop);
        }
        
        // دالة إعادة تعيين اللعبة
        function resetGame() {
            // إعادة تعيين متغيرات اللعبة
            birdPosition = 300;
            birdVelocity = 0;
            score = 0;
            level = 1;
            lives = 3;
            pipes = [];
            obstacles = [];
            coins = [];
            clouds = [];
            powerLevel = 0;
            powerActive = false;
            isPaused = false;
            
            // تحديث العرض
            scoreDisplay.textContent = `النقاط: ${score}`;
            levelDisplay.textContent = `المستوى: ${level}`;
            lifeDisplay.textContent = `الأرواح: ${lives}`;
            powerBar.style.width = `${powerLevel}%`;
            
            // إعادة ضبط موضع الطائر
            bird.style.top = `${birdPosition}px`;
            bird.style.transform = 'rotate(0deg)';
            
            // إزالة جميع العناصر الموجودة
            document.querySelectorAll('.pipe').forEach(pipe => pipe.remove());
            document.querySelectorAll('.obstacle').forEach(obstacle => obstacle.remove());
            document.querySelectorAll('.coin').forEach(coin => coin.remove());
            document.querySelectorAll('.cloud').forEach(cloud => cloud.remove());
            
            // إخفاء شاشة انتهاء اللعبة
            gameOverScreen.style.display = 'none';
            
            // عرض شاشة البداية
            startScreen.style.display = 'flex';
        }
        
        // دالة حلقة اللعبة الرئيسية
        function gameLoop(currentTime) {
            if (isPaused) {
                gameLoopId = requestAnimationFrame(gameLoop);
                return;
            }
            
            // حساب الفرق الزمني
            const deltaTime = currentTime - previousTime;
            previousTime = currentTime;
            
            // تحريك الطائر
            if (!powerActive) {
                birdVelocity += gameSettings.gravity;
            } else {
                birdVelocity += gameSettings.gravity * 0.5; // جاذبية أقل أثناء وضع القوة
            }
            
            birdPosition += birdVelocity;
            
            // دوران الطائر بناءً على سرعته
            const rotation = Math.min(Math.max(birdVelocity * 2, -30), 90);
            bird.style.transform = `rotate(${rotation}deg)`;
            
            // تحديث موضع الطائر
            bird.style.top = `${birdPosition}px`;
            
            // التحقق من اصطدام الطائر بالأرض أو السقف
            if (birdPosition >= 610 || birdPosition <= 0) {
                birdCollision();
            }
            
            // إنشاء أنابيب وعقبات وعملات جديدة
            if (gameActive) {
                if (currentTime - lastPipeTime > gameSettings.pipeFrequency) {
                    createPipe();
                    lastPipeTime = currentTime;
                }
                
                if (currentTime - lastObstacleTime > gameSettings.obstacleFrequency) {
                    createObstacle();
                    lastObstacleTime = currentTime;
                }
                
                if (currentTime - lastCoinTime > gameSettings.coinFrequency) {
                    createCoin();
                    lastCoinTime = currentTime;
                }
            }
            
            // تحريك الأنابيب والتحقق من التصادمات
            movePipes();
            
            // تحريك العقبات والتحقق من التصادمات
            moveObstacles();
            
            // تحريك العملات والتحقق من التصادمات
            moveCoins();
            
            // تحريك الغيوم
            moveClouds();
            
            // عدّاد الإطارات للعناصر الصعبة
            frameCount++;
            if (frameCount >= 300) { // كل ~5 ثواني
                if (Math.random() < 0.3) {
                    createSpecialObstacle();
                }
                frameCount = 0;
            }
            
            // تقليل مستوى القوة مع مرور الوقت إذا كانت نشطة
            if (powerActive) {
                powerLevel -= 1;
                powerBar.style.width = `${powerLevel}%`;
                
                if (powerLevel <= 0) {
                    powerActive = false;
                }
            }
            
            // متابعة حلقة اللعبة إذا كانت اللعبة لا تزال نشطة
            if (gameActive) {
                gameLoopId = requestAnimationFrame(gameLoop);
            }
        }
        
        // دالة إنشاء أنبوب
        function createPipe() {
            // إنشاء فجوة عشوائية
            const gapStart = Math.floor(Math.random() * (400 - gameSettings.gapSize)) + 100;
            
            // إنشاء الأنبوب العلوي
            const topPipe = document.createElement('div');
            topPipe.className = 'pipe';
            topPipe.style.height = `${gapStart}px`;
            topPipe.style.top = '0';
            topPipe.style.left = '360px'; // تبدأ من خارج الشاشة
            topPipe.style.borderRadius = '0 0 10px 10px';
            gameContainer.appendChild(topPipe);
            
            // إنشاء الأنبوب السفلي
            const bottomPipe = document.createElement('div');
            bottomPipe.className = 'pipe';
            bottomPipe.style.height = `${640 - gapStart - gameSettings.gapSize}px`;
            bottomPipe.style.bottom = '0';
            bottomPipe.style.left = '360px'; // تبدأ من خارج الشاشة
            bottomPipe.style.borderRadius = '10px 10px 0 0';
            gameContainer.appendChild(bottomPipe);
            
            // إضافة الأنابيب إلى المصفوفة
            pipes.push({
                top: topPipe,
                bottom: bottomPipe,
                passed: false
            });
        }
        
        // دالة إنشاء عقبة
        function createObstacle() {
            const obstacle = document.createElement('div');
            obstacle.className = 'obstacle';
            
            // موضع عشوائي (مع تجنب التمركز في المسار المعتاد للطائر)
            let y;
            if (Math.random() < 0.5) {
                y = Math.floor(Math.random() * 200) + 50; // القسم العلوي
            } else {
                y = Math.floor(Math.random() * 200) + 390; // القسم السفلي
            }
            
            obstacle.style.left = '360px';
            obstacle.style.top = `${y}px`;
            gameContainer.appendChild(obstacle);
            
            obstacles.push({
                element: obstacle,
                x: 360,
                y: y,
                speedX: -gameSettings.pipeSpeed * 1.2,
                speedY: (Math.random() - 0.5) * 2 // حركة عشوائية لأعلى وأسفل
            });
        }
        
        // دالة إنشاء عقبة خاصة (أكثر صعوبة)
        function createSpecialObstacle() {
            const obstacle = document.createElement('div');
            obstacle.className = 'obstacle';
            obstacle.style.background = 'purple';
            obstacle.style.width = '50px';
            obstacle.style.height = '50px';
            
            // تحديد موضع العقبة الخاصة بالقرب من الطائر
            const y = birdPosition + (Math.random() * 100 - 50);
            obstacle.style.left = '360px';
            obstacle.style.top = `${y}px`;
            gameContainer.appendChild(obstacle);
            
            obstacles.push({
                element: obstacle,
                x: 360,
                y: y,
                speedX: -gameSettings.pipeSpeed * 1.5,
                speedY: 0,
                special: true,
                targetY: birdPosition // تستهدف موضع الطائر
            });
        }
        
        // دالة إنشاء عملة
        function createCoin() {
            const coin = document.createElement('div');
            coin.className = 'coin';
            
            // موضع عشوائي (غالبًا بالقرب من المسار المتوقع للطائر)
            const y = Math.floor(Math.random() * 400) + 100;
            
            coin.style.left = '360px';
            coin.style.top = `${y}px`;
            gameContainer.appendChild(coin);
            
            coins.push({
                element: coin,
                x: 360,
                y: y
            });
        }
        
        // دالة إنشاء الغيوم الأولية
        function createInitialClouds() {
            for (let i = 0; i < 5; i++) {
                createCloud(Math.random() * 360);
            }
        }
        
        // دالة إنشاء غيمة
        function createCloud(x = 360) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            
            const size = Math.random() * 60 + 40;
            const y = Math.random() * 300;
            
            cloud.style.width = `${size}px`;
            cloud.style.height = `${size / 2}px`;
            cloud.style.left = `${x}px`;
            cloud.style.top = `${y}px`;
            gameContainer.appendChild(cloud);
            
            clouds.push({
                element: cloud,
                x: x,
                speed: Math.random() * 0.5 + 0.2 // سرعة عشوائية للغيوم
            });
        }
        
        // دالة تحريك الأنابيب
        function movePipes() {
            for (let i = 0; i < pipes.length; i++) {
                const pipe = pipes[i];
                
                // استخراج الموضع الحالي
                const currentLeft = parseInt(pipe.top.style.left);
                
                // تحريك الأنبوب
                const newLeft = currentLeft - gameSettings.pipeSpeed;
                pipe.top.style.left = `${newLeft}px`;
                pipe.bottom.style.left = `${newLeft}px`;
                
                // التحقق من التصادمات إذا كان الأنبوب بالقرب من الطائر
                if (newLeft <= 100 && newLeft >= 0) {
                    const birdLeft = 60;
                    const birdRight = birdLeft + 40;
                    const birdTop = birdPosition;
                    const birdBottom = birdPosition + 30;
                    
                    const pipeLeft = newLeft;
                    const pipeRight = newLeft + 60;
                    const topPipeBottom = parseInt(pipe.top.style.height);
                    const bottomPipeTop = topPipeBottom + gameSettings.gapSize;
                    
                    // اصطدام بالأنبوب العلوي أو السفلي
                    if (
                        (birdRight > pipeLeft && birdLeft < pipeRight) &&
                        (birdTop < topPipeBottom || birdBottom > bottomPipeTop)
                    ) {
                        if (!powerActive) { // لا تصادم أثناء وضع القوة
                            birdCollision();
                        }
                    }
                }
                
                // زيادة النقاط عند مرور أنبوب
                if (!pipe.passed && newLeft < 40) {
                    score++;
                    scoreDisplay.textContent = `النقاط: ${score}`;
                    pipe.passed = true;
                    createEffects(100, birdPosition);
                    
                    // زيادة مستوى القوة
                    powerLevel = Math.min(powerLevel + 10, 100);
                    powerBar.style.width = `${powerLevel}%`;
                    
                    // زيادة المستوى كل 10 نقاط
                    if (score % 10 === 0) {
                        levelUp();
                    }
                }
                
                // إزالة الأنابيب التي خرجت من الشاشة
                if (newLeft < -60) {
                    pipe.top.remove();
                    pipe.bottom.remove();
                    pipes.splice(i, 1);
                    i--;
                }
            }
        }
        
        // دالة تحريك العقبات
        function moveObstacles() {
            for (let i = 0; i < obstacles.length; i++) {
                const obstacle = obstacles[i];
                
                // تحديث الموضع
                obstacle.x += obstacle.speedX;
                
                if (obstacle.special && obstacle.targetY) {
                    // العقبات الخاصة تتحرك نحو الطائر
                    const dy = obstacle.targetY - obstacle.y;
                    obstacle.y += dy * 0.02;
                } else {
                    obstacle.y += obstacle.speedY;
                    
                    // ارتداد العقبات من حدود اللعبة
                    if (obstacle.y <= 0 || obstacle.y >= 600) {
                        obstacle.speedY = -obstacle.speedY;
                    }
                }
                
                // تحديث موضع العقبة في DOM
                obstacle.element.style.left = `${obstacle.x}px`;
                obstacle.element.style.top = `${obstacle.y}px`;
                
                // التحقق من التصادمات
                const birdLeft = 60;
                const birdRight = birdLeft + 40;
                const birdTop = birdPosition;
                const birdBottom = birdPosition + 30;
                
                const obstacleLeft = obstacle.x;
                const obstacleRight = obstacle.x + 40;
                const obstacleTop = obstacle.y;
                const obstacleBottom = obstacle.y + 40;
                
                if (
                    birdRight > obstacleLeft && birdLeft < obstacleRight &&
                    birdBottom > obstacleTop && birdTop < obstacleBottom
                ) {
                    if (!powerActive) { // لا تصادم أثناء وضع القوة
                        birdCollision();
                        obstacle.element.remove();
                        obstacles.splice(i, 1);
                        i--;
                    }
                }
                
                // إزالة العقبات التي خرجت من الشاشة
                if (obstacle.x < -40) {
                    obstacle.element.remove();
                    obstacles.splice(i, 1);
                    i--;
                }
            }
        }
        
        // دالة تحريك العملات
        function moveCoins() {
            for (let i = 0; i < coins.length; i++) {
                const coin = coins[i];
                
                // تحريك العملة
                coin.x -= gameSettings.pipeSpeed * 0.7;
                coin.element.style.left = `${coin.x}px`;
                
                // التحقق من الالتقاط
                const birdLeft = 60;
                const birdRight = birdLeft + 40;
                const birdTop = birdPosition;
                const birdBottom = birdPosition + 30;
                
                const coinLeft = coin.x;
                const coinRight = coin.x + 25;
                const coinTop = coin.y;
                const coinBottom = coin.y + 25;
                
                if (
                    birdRight > coinLeft && birdLeft < coinRight &&
                    birdBottom > coinTop && birdTop < coinBottom
                ) {
                    // التقاط العملة
                    score += 2;
                    scoreDisplay.textContent = `النقاط: ${score}`;
                    createEffects(coin.x, coin.y);
                    
                    // زيادة مستوى القوة
                    powerLevel = Math.min(powerLevel + 20, 100);
                    powerBar.style.width = `${powerLevel}%`;
                    
                    coin.element.remove();
                    coins.splice(i, 1);
                    i--;
                    
                    // زيادة المستوى كل 10 نقاط
                    if (score % 10 === 0) {
                        levelUp();
                    }
                    
                    continue;
                }
                
                // إزالة العملات التي خرجت من الشاشة
                if (coin.x < -25) {
                    coin.element.remove();
                    coins.splice(i, 1);
                    i--;
                }
            }
        }
        
        // دالة تحريك الغيوم
        function moveClouds() {
            for (let i = 0; i < clouds.length; i++) {
                const cloud = clouds[i];
                
                // تحريك الغيمة
                cloud.x -= cloud.speed;
                cloud.element.style.left = `${cloud.x}px`;
                
                // إزالة الغيوم التي خرجت من الشاشة وإنشاء غيوم جديدة
                if (cloud.x < -100) {
                    cloud.element.remove();
                    clouds.splice(i, 1);
                    i--;
                    
                    // إنشاء غيمة جديدة
                    createCloud();
                }
            }
        }
        
        // دالة لإنشاء تأثير بصري
        function createEffects(x, y) {
            for (let i = 0; i < 5; i++) {
                const effect = document.createElement('div');
                effect.className = 'effect';
                effect.style.left = `${x + Math.random() * 30 - 15}px`;
                effect.style.top = `${y + Math.random() * 30 - 15}px`;
                gameContainer.appendChild(effect);
                
                // إزالة التأثير بعد انتهاء الرسوم المتحركة
                setTimeout(() => {
                    effect.remove();
                }, 500);
            }
        }
        
        // دالة لمعالجة اصطدام الطائر
        function birdCollision() {
            lives--;
            lifeDisplay.textContent = `الأرواح: ${lives}`;
            createEffects(60, birdPosition);
            
            if (lives <= 0) {
                endGame();
            } else {
                // إعادة ضبط موضع الطائر بعد الاصطدام
                birdPosition = 300;
                birdVelocity = 0;
                bird.style.top = `${birdPosition}px`;
            }
        }
        
        // دالة لزيادة المستوى
        function levelUp() {
            level++;
            levelDisplay.textContent = `المستوى: ${level}`;
            
            // زيادة صعوبة اللعبة مع كل مستوى
            gameSettings.pipeSpeed += 0.2;
            gameSettings.pipeFrequency = Math.max(gameSettings.pipeFrequency - 100, 800);
            gameSettings.gapSize = Math.max(gameSettings.gapSize - 5, 120);
            
            // تأثير بصري لزيادة المستوى
            levelDisplay.style.fontSize = '24px';
            levelDisplay.style.color = 'gold';
            setTimeout(() => {
                levelDisplay.style.fontSize = '18px';
                levelDisplay.style.color = 'white';
            }, 1000);
        }
        
        // دالة لإنهاء اللعبة
        function endGame() {
            gameActive = false;
            cancelAnimationFrame(gameLoopId);
            
            // تحديث أعلى نتيجة إذا لزم الأمر
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('flappyHighScore', highScore);
                highScoreDisplay.textContent = `أعلى نتيجة: ${highScore}`;
            }
            
            // عرض شاشة انتهاء اللعبة
            finalScoreSpan.textContent = score;
            gameOverScreen.style.display = 'flex';
        }
        
        // دالة لمعالجة حدث ضغط المفاتيح
        function handleKeyDown(e) {
            if (e.code === 'Space' || e.key === ' ') {
                if (gameActive && !isPaused) {
                    e.preventDefault();
                    jump();
                }
            } else if (e.key === 'p' || e.key === 'P') {
                togglePause();
            } else if (e.key === 'z' || e.key === 'Z') {
                if (powerLevel >= 100) {
                    activatePower();
                }
            }
        }
        
        // دالة لمعالجة حدث رفع المفاتيح
        function handleKeyUp(e) {
            // تنفيذ القوة الخاصة عند رفع مفتاح Z
            if ((e.key === 'z' || e.key === 'Z') && gameActive && !isPaused && powerActive) {
                deactivatePower();
            }
        }
        
        // دالة لمعالجة النقر
        function handleClick() {
            if (gameActive && !isPaused) {
                jump();
            }
        }
        
        // دالة للقفز
        function jump() {
            birdVelocity = gameSettings.jumpForce;
            
            // تأثير بصري للقفز
            createEffects(60, birdPosition + 30);
        }
        
        // دالة لتفعيل القوة الخاصة
        function activatePower() {
            if (powerLevel >= 100) {
                powerActive = true;
                bird.style.background = 'gold';
                
                // تأثير بصري لتفعيل القوة
                createEffects(60, birdPosition);
                createEffects(60, birdPosition + 15);
                createEffects(60, birdPosition + 30);
            }
        }
        
        // دالة لإلغاء تفعيل القوة الخاصة
        function deactivatePower() {
            powerActive = false;
            bird.style.background = 'yellow';
        }
        
        // دالة للإيقاف المؤقت
        function togglePause() {
            isPaused = !isPaused;
            pauseButton.textContent = isPaused ? 'استمرار' : 'توقف مؤقت';
            
            if (!isPaused && gameActive) {
                previousTime = performance.now();
            }
        }
        
        // استدعاء دالة resetGame للإعداد الأولي
        resetGame();
        
        // دالة لدعم أجهزة اللمس
        gameContainer.addEventListener('touchstart', function(e) {
            if (gameActive && !isPaused) {
                e.preventDefault();
                jump();
            }
        });
        
        // دالة لدعم اللاعبين المتقدمين (Konami Code)
        let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let konamiIndex = 0;
        
        document.addEventListener('keydown', function(e) {
            if (e.key === konamiCode[konamiIndex]) {
                konamiIndex++;
                if (konamiIndex === konamiCode.length) {
                    // منح اللاعب حياة إضافية
                    lives++;
                    lifeDisplay.textContent = `الأرواح: ${lives}`;
                    createEffects(180, 320);
                    konamiIndex = 0;
                }
            } else {
                konamiIndex = 0;
            }
        });
        
        // تحديث تصميم الطائر ليكون أكثر جاذبية
        function updateBirdDesign() {
            // تحديث لون الطائر مع المستوى
            if (level >= 5) {
                bird.style.background = 'orange';
            }
            if (level >= 10) {
                bird.style.background = 'red';
            }
            if (level >= 15) {
                bird.style.background = 'purple';
            }
        }
        
        // إضافة مستوى إضافي من التحدي
        function addExtraChallenge() {
            if (level >= 5) {
                // إضافة موجات من العقبات
                if (frameCount % 600 === 0) {
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => {
                            if (gameActive) createObstacle();
                        }, i * 200);
                    }
                }
            }
        }