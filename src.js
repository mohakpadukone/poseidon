const c = document.getElementById("gameCanvas");
const ctx = c.getContext("2d");

c.width = window.innerWidth;
c.height = window.innerHeight;

const SCALEW = 1903/941;

const ORIGWIDTH = 1903;
const ORIGHEIGHT = 941;
const SCREENWIDTH = window.innerWidth;
const SCREENHEIGHT = window.innerHeight;

const SCALEX = (SCREENWIDTH/ORIGWIDTH)
const SCALEY = (SCREENHEIGHT/ORIGHEIGHT);

const CENTER_X = 100;
const CENTER_Y = 100;
const molecules = [];
var ignoreList = [];
var blueImg = document.getElementById("blue");
var greenImg = document.getElementById("green");

const START_X = 450 * SCALEX;
const START_Y = 160 * SCALEY;
const HEIGHT = 675 * SCALEY;
const WIDTH = 1300 * SCALEX;

let mouseHoverRestart = false;


const circleColors = {
  'blue': 50,
  'green': 50,
};

var greens = 0;
var blues = 0;

let gameover = false;

var speed = 0.5;

var score = 0;
var timer = '00:45';
var time = 45;
var frame = 0;
var toxicity = 50;

var selected = null;
var mouseDown = false;

var alpha = 0.7;
var bluePopped = false;

var blueGradient;
var greenGradient;
var timeGradient;

var slowPopped = false;
var currentTime;

// function for weighted colors
// https://stackoverflow.com/questions/43566019/how-to-choose-a-weighted-random-array-element-in-javascript
function getColor(input) {
  var array = []; // Just Checking...
  for(var circleColors in input) {
      if ( input.hasOwnProperty(circleColors) ) { // Safety
          for( var i=0; i<input[circleColors]; i++ ) {
              array.push(circleColors);
          }
      }
  }
  return array[Math.floor(Math.random() * array.length)];
};

//overlay green animation over canvas
function fadeOut(){
      ctx.fillStyle = "rgba(204, 60, 60, " + alpha + ")";
      var style = ctx.fillStyle
      drawRect(ctx, 0, 0, 1903* SCALEX, 941* SCALEY, style);
      if(alpha <= 1 && alpha >= 0.7){
        alpha = alpha + 0.001; // decrease opacity (fade out)
      }
      if(alpha <= 0.989){
        alpha = alpha - 0.02;
      }
      if(alpha <= 0){
        alpha = 0.7;
        bluePopped = false;
      }
}



//drawtext function
const DrawText = (ctx, x, y, font, type, size, style, text) => {
  ctx.font = `${type} ${size}px ${font}`;
  ctx.fillStyle = style;
  ctx.fillText(text, x, y, 140);
}


//Molecule class
class Mol {
    constructor(canvas, ctx, {x, y, vx, vy, radius, color}) {
      this.ctx = ctx;
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.radius = radius;
      this.color = color;
    }

    draw() {
      ctx.beginPath();

      blueGradient = ctx.createLinearGradient(this.x - this.radius, this.y - this.radius, this.x + this.radius, this.y + this.radius);
      blueGradient.addColorStop("0", "#3DB5DB");//E1F0FD
      blueGradient.addColorStop("1", "rgba(28,80,128,0.3)");//005C90

      greenGradient = ctx.createLinearGradient(this.x - this.radius, this.y - this.radius, this.x + this.radius, this.y + this.radius);
      greenGradient.addColorStop("0", "#00905C");//DFFF9B
      greenGradient.addColorStop("1", "rgba(222,255,210,0.3)");//00905C

      timeGradient = ctx.createLinearGradient(this.x - this.radius, this.y - this.radius, this.x + this.radius +50, this.y + this.radius);
      timeGradient.addColorStop("0", "#DB3D92");//DFFF9B
      timeGradient.addColorStop("1", "rgba(128,28,88,0.3)");//00905C

      if(this.color == "blue"){
        ctx.fillStyle = blueGradient;
        
      }
      if(this.color =="green"){
        ctx.fillStyle = greenGradient;
      }
      if(this.color =="red"){
        ctx.fillStyle = timeGradient;      
      }
    
      var strokeGradient = ctx.createLinearGradient(this.x - this.radius, this.y - this.radius, this.x + this.radius, this.y + this.radius);
      strokeGradient.addColorStop("0.2", "#fff");
      strokeGradient.addColorStop("0.45", "#667794");
      strokeGradient.addColorStop("0.8", "#fff");

      ctx.strokeStyle = strokeGradient;
      ctx.lineWidth = 1.5;
      ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();    
    
      if(this.color =="red"){
        const img = new Image();
      img.src = "assets/time.png";
      ctx.drawImage(img,this.x - 30, this.y - 36.665,60,73.33); 
      }
      
    
    }

    move() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y > START_Y  + HEIGHT - this.radius || this.y < START_Y + this.radius) {
        this.vy = -this.vy;      
      }
      if (this.x > START_X  + WIDTH - this.radius || this.x  < START_X + this.radius) {
        this.vx = -this.vx;       
      }
      window.requestAnimationFrame(() => this.draw());
    }
  }


  //check if mouse is inside circle
  const MouseInCircle = (circle, mouse) => {
    return Math.sqrt((circle.x - mouse.x)*(circle.x - mouse.x) + (circle.y - mouse.y) * (circle.y - mouse.y)) < circle.radius;
  };

  const MouseInBox = (box, mouse) => {
    return (box.x <= mouse.x && box.x + box.width >= mouse.x && box.y <= mouse.y && box.y + box.height >= mouse.y);
}

  //generate random number given min and max
  function rand(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Add 6 molecules (3 green, 3 blue) at the start of the game
  for(let i = 1; i < 7 ; i++) {

      //adding blue
      if(i > 3){
        mol = new Mol (c, ctx, {
          x: rand(START_X * SCALEX+ 100, START_X * SCALEX+ WIDTH - 100),
          y: rand(START_Y * SCALEY+ 100, START_Y * SCALEY+ HEIGHT - 100),
          vx: rand(0.1, speed + 0.75),
          vy: rand(0.1, speed + 0.75),
          radius: rand(50, 100),     
          color: "blue",
        });
        molecules.push(mol);
      }    

      //adding green
      if(i <= 3){  
      mol = new Mol (c, ctx, {
        x: rand(START_X * SCALEX+ 100, START_X * SCALEX+ WIDTH - 100),
        y: rand(START_Y * SCALEY+ 100, START_Y * SCALEY+ HEIGHT - 100),
        vx: rand(0.1, speed + 0.75),
        vy: rand(0.1, speed + 0.75),
        radius: rand(50, 100),     
        color: "green",
      });
      molecules.push(mol);
      }
  }

  const Restart = () => {
    gameover = false;
    score = 0;
    time = 45;
    //blueScore = 0;
    //redScore = 0;
    //greenScore = 0;
    timer = '00:45';
    frame = 0;
    molecules.splice(0, molecules.length)

    location.reload();
    
  
};

  c.addEventListener('mousemove', function (e){
    const mouse = {x: e.clientX, y: e.clientY};
    const box = {x:777 *SCALEX, y:610*SCALEY, width:350*SCALEX, height:106*SCALEY};
    if(gameover){
        if(MouseInBox(box, mouse)){
            mouseHoverRestart = true;
            Restart();
            console.log("true");
        } else {
            mouseHoverRestart = false;
        }
    }
  });

  
 // if mouse is clicked pop and add 
  c.addEventListener('mousedown', function (e){
    mouseDown = true;
    const mouse = {x: e.clientX, y: e.clientY};

    
    // check if bubble is popped
    for(var i = 0 ; i < molecules.length; i++){
      var circle = molecules[i];
      if(MouseInCircle(molecules[i], mouse)){
          let pos = molecules.indexOf(molecules[i]);
          
          //if green bubble is popped
          if(molecules[i].color == "green"){
            score += 100;

            mol = new Mol (c, ctx, {
              x: rand(START_X * SCALEX+ 100, START_X * SCALEX+ WIDTH - 100),
              y: rand(START_Y * SCALEY+ 100, START_Y * SCALEY+ HEIGHT - 100),
              vx: rand(0.1 , speed + 0.75),
              vy: rand(0.1, speed + 0.75),
              radius: rand(50, 100),     
              color: getColor(circleColors),
            });
            molecules.push(mol);        
          }


          //if blue bubble is popped
          if(molecules[i].color == "blue"){
            if(score != 0){
            score -= 200;
            bluePopped = true;
            }

            mol = new Mol (c, ctx, {
              x: rand(START_X * SCALEX+ 100, START_X * SCALEX+ WIDTH - 100),
              y: rand(START_Y * SCALEY+ 100, START_Y * SCALEY+ HEIGHT - 100),
              vx: rand(0.1 , speed + 0.75),
              vy: rand(0.1, speed + 0.75),
              radius: rand(50, 100),     
              color: "green",
            });
            molecules.push(mol);    
          }

          if(molecules[i].color == "red"){
            slowPopped = true;
            currentTime = time;
          }
          
          //remove that bubble and increase speed
          molecules.splice(pos, 1);
          speed += 0.5;
      }      
    }
});



// updates 
const Update = () => {
  frame++;
  //calculate each second
  if(frame == 60){
      frame = 0;
      //every second
      if(time > 0){
        time--; // reduce time by 1

        // calculate molecules and toxicity
        greens = 0;
        blues = 0;
        for(var i = 0; i < molecules.length; i++){
          if(molecules[i].color == "blue"){
            blues++;
          }
          else{
            greens++;
          }          
        }

        toxicity = Math.round(greens/molecules.length * 100);
      }


      //add green molecule every 2 second
      if(time % 2 === 0){
        mol = new Mol (c, ctx, {
          x: rand(START_X * SCALEX+ 100, START_X * SCALEX+ WIDTH - 100),
          y: rand(START_Y * SCALEY+ 100, START_Y * SCALEY+ HEIGHT - 100),
          vx: rand(0.1 , speed + 0.75),
          vy: rand(0.1, speed + 0.75),
          radius: rand(50, 100),     
          color: "green",
        });
        molecules.push(mol);
        speed += 0.5;
      }

      //special bubble every 10 seconds
      if(time % 10 === 0){
        mol = new Mol (c, ctx, {
          x: rand(START_X * SCALEX+ 100, START_X * SCALEX+ WIDTH - 100),
          y: rand(START_Y * SCALEY+ 100, START_Y * SCALEY+ HEIGHT - 100),
          vx: rand(1 , 2),
          vy: rand(1,  2),
          radius: 90,     
          color: "red",
        });

        molecules.push(mol);
      }


  }

  //update timer text
  if(time == 45){
      timer = '00:45';
  } if(time < 45){
      timer = `00:${time}`;
  } if (time < 10){      
      timer = `00:0${time}`;    
  } if (time <= 0){      
    timer = `00:0${time}`;  
    gameover = true;  
  }
  
  
  //freeze the bubbles
  if(slowPopped == true){
    if(time <= currentTime && time >= currentTime - 3){
      for(var i = 0 ; i < molecules.length; i++){
        molecules[i].vx = rand(-1,1);
        molecules[i].vy = rand(-1,1);  
      }   
  }
}


};

//draw visuals and text
const Draw = () => {
  if(!gameover){
  ctx.clearRect(0,0,1920* SCALEX,1080* SCALEY);
  const img = new Image();
  const img1 = new Image();
  img.src = "assets/bg.png";
  img1.src = "assets/bg1.png";
  ctx.drawImage(img,0,0,1903 * SCALEX,941* SCALEY);
  if(score == 0){
      DrawText(ctx, 185* SCALEX, 235* SCALEY, 'Oxanium', 'normal', 40, 'white', '0000');
  } else {
      DrawText(ctx, 185* SCALEX, 235* SCALEY, 'Oxanium', 'normal', 40, 'white', `${score}`);
  }
  DrawText(ctx, 1625* SCALEX, 95* SCALEY, 'Orbitron', 'normal', 35, 'white', timer);

  DrawText(ctx, 200* SCALEX, 522* SCALEY, 'Oxanium', 'normal', 30, 'white', `${toxicity} %`);

  //toxicity bars 

  var blueBarGradient = ctx.createLinearGradient(187* SCALEX, 337* SCALEY, 187* SCALEX, 346* SCALEY);
  blueBarGradient.addColorStop("0", "#E1F0FD");//E1F0FD
  blueBarGradient.addColorStop("1", "#005C90");//005C90

  var greenBarGradient = ctx.createLinearGradient(187* SCALEX, 376* SCALEY, 187* SCALEX, 383* SCALEY);
  greenBarGradient.addColorStop("0", "#DFFF9B");//DFFF9B
  greenBarGradient.addColorStop("1", "#00905C");//00905C


  drawRect(ctx, 187* SCALEX, 337* SCALEY, 168*(100-toxicity)/100, 8, blueBarGradient);

  drawRect(ctx, 187* SCALEX, 376* SCALEY, 168*toxicity/100, 8, greenBarGradient);
  
  
  //overlay if blue popped
  if(bluePopped == true){
    fadeOut();
  }  

//   if(gameover){
//     const bg = new Image();
//     bg.src = "assets/gameover.png";
//     ctx.drawImage(bg,0,0,1903 * SCALEX,941 * SCALEY);

//     DrawText(ctx, 950 *SCALEX, 570 *SCALEY, 'Orbitron', 'normal', 25, 'white', "center", `Your score : ${score}`);

//     const restartButton = new Image();
//     restartButton.src = "assets/restartbutton.svg";
//     if(mouseHoverRestart){
//         ctx.globalAlpha = 0.5;
//         ctx.drawImage(restartButton, 777 *SCALEX, 610*SCALEY, 350*SCALEX, 106*SCALEY, );
//         ctx.globalAlpha = 1;
//     } else {
//         ctx.drawImage(restartButton, 777 *SCALEX, 610*SCALEY, 350*SCALEX, 106*SCALEY);
//     }
// }

  ctx.drawImage(img1,0,0,1903* SCALEX,941* SCALEY);
  }
  if(gameover){
  //game over screen
  //if(time == 0){
    var w = 1903* SCALEX;
    var h = 941* SCALEY;
    const go = new Image();
    go.src = "assets/gameover.png";
    ctx.drawImage(go,0,0,w,h);

    DrawText(ctx, 1021* SCALEX, 563* SCALEY, 'Orbitron', 'normal', 25, 'white', `${score}`);

    const restartButton = new Image();
    restartButton.src = "assets/restartbutton.svg";
    if(mouseHoverRestart){
        ctx.globalAlpha = 0.5;
        ctx.drawImage(restartButton, 777 *SCALEX, 610*SCALEY, 350*SCALEX, 106*SCALEY, );
        ctx.globalAlpha = 1;
    } else {
        ctx.drawImage(restartButton, 777 *SCALEX, 610*SCALEY, 350*SCALEX, 106*SCALEY);
    }
  //   const goButton = new Image();
  //   goButton.src = "assets/button.png";
  //   ctx.drawImage(goButton,780* SCALEX,615* SCALEY,350* SCALEX,106* SCALEY);

  //   c.addEventListener('mousedown', function (e){
  //     const mouse = {x: e.clientX, y: e.clientY};

  //     if(mouse.x > 780 && mouse.x < 1130 && mouse.y > 615 && mouse.y < 712){
  //       location.reload();
  //     }

  // });
//}
}
}

//function to draw rect
const drawRect = (ctx, x, y, width, height, color) => {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
  ctx.closePath();
};


// interval
setInterval(() => {
    // until time runs outs
    if(time >= 1){
      Update();     
      molecules.map((el) => {
        el.move();
      });
    }
    //Update();
    Draw();
 }, 1000/60);
 

