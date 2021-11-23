var player;
var platforms;
var cursors;
var stars;
var bombs;
var dpad;
var falling = false;
var jumped = false;

var score = 0;
var scoreText;

var tracking = false
var trkstartx = 0
var trkstarty = 0


class GameScene extends Phaser.Scene {
    constructor () { super("GameScene"); }
    
    preload() {
    //    this.stage.backgroundColor = '#85b5e1';
        this.load.image ('sky', 'sky.png');
        this.load.image ('ground', 'platform.png');
        this.load.image ('star', 'star.png');
        this.load.image ('bomb', 'bomb.png');
        this.load.spritesheet ('dude', 'dude.png', {frameWidth: 32, frameHeight: 48});
        this.load.spritesheet ('ring', 'sonic-ring.png', {frameWidth: 64, frameHeight: 64});
        
        this.load.atlas('sonic', 'sonic-sprites.png', 'sonic-sprites.json');
        
        this.load.image('dpad', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Simpleicons_Business_circle-of-pie-chart-for-business.svg/200px-Simpleicons_Business_circle-of-pie-chart-for-business.svg.png');
    }
    
    create() {
        this.anims.create({
           key: 'idle',
           frames:  this.anims.generateFrameNames ('sonic', {prefix: 'sprite', zeropad: 2, frames: [32, 33, 34, 35]}),
           frameRate: -1,
           yoyo: true
        });
        this.anims.create({
           key: 'run',
           frames: this.anims.generateFrameNames ('sonic', 
            {prefix: 'sprite', zeropad: 2, frames: [78, 79, 86, 90, 80, 81, 87, 91, 82, 83, 88, 92, 84, 85, 89, 93]}),
           frameRate: 10,
           repeat: -1
        });
        this.anims.create({
           key: 'fall',
           frames:  this.anims.generateFrameNames ('sonic', {prefix: 'sprite', zeropad: 2, frames: [165, 166, 167]}),
           frameRate: -1,
           yoyo: true
        });
        this.anims.create({
            key: 'rotate',
            frames: this.anims.generateFrameNumbers ('ring', {start: 0, end: 15}),
            frameRate: 10,
            repeat: -1
        });
        
        this.add.image (400, 300, 'sky');
        
        platforms = this.physics.add.staticGroup();
        platforms.create (400, 568, 'ground').setScale(2).refreshBody();
        platforms.create (600, 400, 'ground');
        platforms.create (50, 250, 'ground');
        platforms.create (750, 220, 'ground');
    
        player = this.physics.add.sprite(110, 490, 'sonic').play('idle');
        player.setBounce (0.2);
        player.setCollideWorldBounds(true);
        player.scale = 1.5;
        
        this.physics.add.collider (player, platforms);
    
        stars = this.physics.add.group({
           key: 'ring',
           repeat: 11,
           setXY: {x: 12, y: 0, stepX: 70},
           setScale: {x: 0.5, y: 0.5 },
    //       frame: [0, 1, 2, 3, 4, 5, 6, 7, 8]
        });
        stars.children.iterate (function (child) {
           child.setBounceY (Phaser.Math.FloatBetween (0.4, 0.8));
           child.play ('rotate'); 
        });
    
        this.physics.add.collider (stars, platforms);
        this.physics.add.overlap (player, stars, (p,e)=>{this.collectStar (p,e); }, null, this);
    
        bombs = this.physics.add.group();
        this.physics.add.collider (bombs, platforms);
        this.physics.add.collider (player, bombs, (p,e)=>{this.hitBomb (p,e); }, null, this);
        
        cursors = this.input.keyboard.createCursorKeys();
        dpad = this.input.addPointer();
        
        this.add.image (60, 540, 'dpad').setScale(0.5);
    
        scoreText = this.add.text(16, 16, 'score: 0', {fontSize: '32px', fill: '#000'});
        
    }
    
    collectStar (player, star) {
        star.disableBody (true, true);
        
        score += 10;
        scoreText.setText ('Score: ' + score);
        
        if (stars.countActive (true) === 0) {
            stars.children.iterate (function (child) {
               child.enableBody (true, child.x, 0, true, true); 
            });
            
            let x = (player.x < 400) ? Phaser.Math.Between (400, 800) : Phaser.Math.Between (0, 400);
            
            var bomb = bombs.create (x, 16, 'bomb');
            bomb.setBounce (1);
            bomb.setCollideWorldBounds (true);
            bomb.setVelocity (Phaser.Math.Between (-200, 200), 20);
        }
    }
    
    hitBomb (player, bomb) {
        this.physics.pause();
        player.setTint (0xf00000);
        player.anims.play('turn');
        gameOver = true;
    }
    
    update () {
    
        let pointer = game.input.activePointer;
        
        if (tracking) {
            if (pointer.isDown) {
                let movex = pointer.x;
                let movey = pointer.y;
                
                if (movex < trkstartx) {
                    player.setVelocityX (-160);
                    player.anims.play ('left', true);
                }
                
                if (movex > trkstartx) {
                    player.setVelocityX (160);
                    player.anims.play ('right', true);
                }
                
                if (movey < (trkstarty - 20) && player.body.touching.down) {
                    trkstarty = movey
                    player.setVelocityY (-330);
                }
            }
            else {
                tracking = false;
                player.anims.play('idle');
            }
        }
        else {
            if (cursors.left.isDown)
            {
                player.setVelocityX (-160);
                if (!falling) { player.anims.play ('run', true); }
                player.flipX = true;
            }
            else if (cursors.right.isDown)
            {
                player.setVelocityX (160);
                if (!falling) { player.anims.play ('run', true); }
                player.flipX = false;
            }
            else {
                player.setVelocityX(0);
                if (!falling) { player.anims.play('idle'); }
            }
            
            if (cursors.up.isDown && player.body.touching.down) {
                player.setVelocityY (-330);
            }
    
            if (pointer.isDown) {
               trkstartx = pointer.x;
                trkstarty = pointer.y;
                tracking = true;
            }
        }
    
    //    console.log(player.body.touching.down, " - ", player.body.velocity.y, " - ", falling)    
        if (player.body.touching.down === false && player.body.velocity.y > 50) {
            if (falling === false) {
                falling = true;
                player.anims.play('fall');
            }
        }
        else { falling = false; }
    }
};


var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
};

var game = new Phaser.Game(config);
