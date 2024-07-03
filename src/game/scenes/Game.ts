import { Scene } from 'phaser';

export class Game extends Scene {
    private paddleLeft!: Phaser.Physics.Arcade.Image;
    private paddleRight!: Phaser.Physics.Arcade.Image;
    private ball!: Phaser.Physics.Arcade.Image;
    
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wKey!: Phaser.Input.Keyboard.Key;
    private sKey!: Phaser.Input.Keyboard.Key;

    private ballVelocityX: number = 300;
    private ballVelocityY: number = 300;

    private scoreLeft: number = 0;
    private scoreRight: number = 0;
    private scoreTextLeft!: Phaser.GameObjects.Text;
    private scoreTextRight!: Phaser.GameObjects.Text;

    private scoreLimit: number = 5;
    private winnerText!: Phaser.GameObjects.Text;
    private gameOver: boolean = false;

    private playAgainButton!: Phaser.GameObjects.Text;

    constructor() {
        super('Game');
    }

    preload() {
        this.load.setPath('assets');

        // Load paddle and ball images
        this.load.image('paddle', 'left.png');
        this.load.image('ball', 'ball1.png');
    }

    create() {
        const { width, height } = this.scale;

        // Create paddles
        this.paddleLeft = this.physics.add.image(20, height / 2, 'paddle');
        this.paddleRight = this.physics.add.image(width - 20, height / 2, 'paddle');
        this.paddleLeft.setImmovable(true);
        this.paddleRight.setImmovable(true);

        // Scale paddles
        this.paddleLeft.setDisplaySize(20, 250);
        this.paddleRight.setDisplaySize(20, 250);
        
        // Create ball and enable physics
        this.ball = this.physics.add.image(width / 3, height / 3, 'ball');
        this.ball.setDisplaySize(50, 50);
        this.ball.setVelocity(this.ballVelocityX, this.ballVelocityY);
        this.ball.setBounce(1, 1);

        // Set ball to collide with world bounds only on top and bottom
        this.ball.setCollideWorldBounds(true);
        this.ball.body.onWorldBounds = true;

        // paddleRight controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        //  collision between ball and paddles
        this.physics.add.collider(this.ball, this.paddleLeft, this.handleBallPaddleCollisionLeft, undefined, this);
        this.physics.add.collider(this.ball, this.paddleRight, this.handleBallPaddleCollisionRight, undefined, this);

        //  Score texts
        this.scoreTextLeft = this.add.text(width / 4, 20, '0', { fontSize: '70px'});
        this.scoreTextRight = this.add.text((3 * width) / 4, 20, '0', { fontSize: '70px'});

        // Winner text
        this.winnerText = this.add.text(width / 2, height / 2, '', { fontSize: '64px' }).setOrigin(0.5);

        // Handle world bounds collision for the ball
        this.physics.world.on('worldbounds', this.handleBallWorldBoundsCollision, this);

        // Create "Play Again" button
        this.playAgainButton = this.add.text(width / 2, height / 2 + 100, 'Play Again', { fontSize: '32px', backgroundColor: '#fff', color: '#000' })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => this.resetGame())
        .setVisible(false);
    }

    update() {
        const { width, height } = this.scale;
        
        if (this.gameOver) {
            return;
        }

        // paddles stay within bounds
        this.paddleLeft.y = Phaser.Math.Clamp(this.paddleLeft.y, 0, height);
        this.paddleRight.y = Phaser.Math.Clamp(this.paddleRight.y, 0, height);

        // PaddleRight movement <arrow keys down and up>
        if (this.cursors.up.isDown) {
            this.paddleRight.y -= 10;
        } else if (this.cursors.down.isDown) {
            this.paddleRight.y += 10;
        }

        // PaddleLeft movement <keyboard keys w and s>
        if (this.wKey.isDown) {
            this.paddleLeft.y -= 10;
        } else if (this.sKey.isDown) {
            this.paddleLeft.y += 10;
        }
        //  ball is out of bounds and update score
        if (this.ball.x < 0) {
            this.scoreRight += 1;
            this.scoreTextRight.setText(this.scoreRight.toString());
            if (this.checkWinner()) return;
            this.resetBall();
        } else if (this.ball.x > width) {
            this.scoreLeft += 1;
            this.scoreTextLeft.setText(this.scoreLeft.toString());
            if (this.checkWinner()) return;
            this.resetBall();
        }
    }

    handleBallPaddleCollisionLeft(ball: Phaser.Physics.Arcade.Image) {
        // Reverse the X velocity to simulate bounce
        ball.setVelocityX(ball.body.velocity.x * 1.2);
    }

    handleBallPaddleCollisionRight(ball: Phaser.Physics.Arcade.Image) {
        // Reverse the X velocity to simulate bounce
        ball.setVelocityX(ball.body.velocity.x * 1.2);
    }

    handleBallWorldBoundsCollision(body: Phaser.Physics.Arcade.Body, up: boolean, down: boolean, left: boolean, right: boolean) {
        if (up || down) {
            // Reverse the Y velocity to bounce off top and bottom
            body.gameObject.setVelocityY(body.velocity.y * 1);
        }
        if (left) {
            this.scoreRight += 1;
            this.scoreTextRight.setText(this.scoreRight.toString());
            if (this.checkWinner()) return;
            this.resetBall();
        } else if (right) {
            this.scoreLeft += 1;
            this.scoreTextLeft.setText(this.scoreLeft.toString());
            if (this.checkWinner()) return;
            this.resetBall();
        }
    }
    

    resetBall() {
        const { width, height } = this.scale;
        this.ball.setPosition(width / 2, height / 2);
        const newBallVelocityX = Phaser.Math.Between(2, 1) ? this.ballVelocityX : -this.ballVelocityX;
        this.ball.setVelocity(newBallVelocityX, this.ballVelocityY);
    }

    checkWinner() {
        if (this.scoreLeft >= this.scoreLimit) {
            this.winnerText.setText('Left Player Wins!');
            this.gameOver = true;
            this.physics.pause();
            this.playAgainButton.setVisible(true);
            return true;
        } else if (this.scoreRight >= this.scoreLimit) {
            this.winnerText.setText('Right Player Wins!');
            this.gameOver = true;
            this.physics.pause();
            this.playAgainButton.setVisible(true);
            return true;
        }
        return false;
    }
    
    resetGame() {
        // Reset scores
        this.scoreLeft = 0;
        this.scoreRight = 0;
        this.scoreTextLeft.setText(this.scoreLeft.toString());
        this.scoreTextRight.setText(this.scoreRight.toString());

        // Hide winner text and play again button
        this.winnerText.setText('');
        this.playAgainButton.setVisible(false);

        // Reset game over state and resume physics
        this.gameOver = false;
        this.physics.resume();

        // Reset ball and paddle positions
        this.resetBall();
        const { height } = this.scale;
        this.paddleLeft.setPosition(20, height / 2);
        this.paddleRight.setPosition(this.scale.width - 20, height / 2);
    }
}
