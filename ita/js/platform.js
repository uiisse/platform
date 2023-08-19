
// Ottieni il riferimento al canvas
var canvas = document.getElementById("platform_canvas");
const ctx = canvas.getContext("2d");
canvas.width = map.width;
canvas.height = map.height;

// Importa i moduli necessari da Matter.js
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Body = Matter.Body,
    Bodies = Matter.Bodies,
    Vertices = Matter.Vertices,
    Query = Matter.Query,
    Events = Matter.Events,
    Runner = Matter.Runner,
    Constraint = Matter.Constraint,
    Composite = Matter.Composite,
    Composites = Matter.Composites

// Crea un motore
const engine = Engine.create({
  gravity: {
    x: 0, // Componente x della gravità (orizzontale)
    y: 1 // Componente y della gravità (verticale)
  }
});

// Crea un renderer
var render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: map.width,
        height: map.height,
        background: COLOR_DIRT_DARKER, 
        visible: false,
        showCollisions: false,
        wireframes: false
    }
});

// livello completato?
var levelComplete = false
// gameover?
var gameOver = false

var soundSteps = new Howl({
  src: ['sounds/soundStep.wav']
});
// Impostazione della velocità di riproduzione al triplo
soundSteps.rate(3.0);

var soundJump = new Howl({
  src: ['sounds/soundJump.wav']
});


function addStaticPolygon(path, x, y, color)
{
  var vertz = Vertices.fromPath(path);

  // crea il poligono, dai vertici
  var polygon = Bodies.fromVertices(x, y, vertz, 
  {
    isStatic: true,
    render: {
      fillStyle: color,
      strokeStyle: color,
      lineWidth: -1 
    }
  });      
  
  // aggiungiamo il poligono
  Composite.add(engine.world, [polygon]);  

  return polygon
}

// Funzione per verificare se un punto è all'interno di un poligono
function isPointInsidePolygon(point, vertices) {
  let inside = false;
  const x = point.x;
  const y = point.y;
  const numVertices = vertices.length;

  for (let i = 0, j = numVertices - 1; i < numVertices; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

// Funzione per trovare i punti interni al poligono dato un array dei suoi vertici
function findInteriorPoints(vertices, numPoints) 
{
  const minX = Math.min(...vertices.map((vertex) => vertex.x));
  const minY = Math.min(...vertices.map((vertex) => vertex.y));
  const maxX = Math.max(...vertices.map((vertex) => vertex.x));
  const maxY = Math.max(...vertices.map((vertex) => vertex.y));

  const interiorPoints = [];
  let count = 0;

  while (count < numPoints) {
    const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
    const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

    const point = { x, y };

    if (isPointInsidePolygon(point, vertices)) {
      interiorPoints.push(point);
      count++;
    }
  }

  return interiorPoints;
}

function addInternalCosmeticSprites(points, numPoints, spriteimg, shiftx = 0, shifty = 0)
{
  const interiorPoints = findInteriorPoints(points, numPoints);

  for (let i = 0; i < interiorPoints.length; i++) 
  {
    const position = interiorPoints[i]

    const sprimgbody = Bodies.rectangle(position.x + shiftx, position.y + shifty, 16, 16, {
      isStatic: true, // la sprite cosmetica resta ferma per sempre in quel posto
      isSensor: true, // Impostiamo isSensor su true per evitare collisioni fisiche
      angle: Math.random() * Math.PI * 2, // Angolo casuale in radianti
      render: {
        sprite: {
          texture: spriteimg,
          xScale: 1,
          yScale: 1,
        },
      },
    });

    Composite.add(engine.world, [sprimgbody]);
  }

}

function addCosmeticBorder(vertices, spriteimg)
{
  const edges = vertices.length;

  for (let i = 0; i < edges; i++) {
    const vertexA = vertices[i];
    const vertexB = vertices[(i + 1) % edges];

    const segmentLength = Matter.Vector.magnitude(Matter.Vector.sub(vertexB, vertexA));
    const numSprites = Math.ceil(segmentLength / 32); // Lunghezza della sprite

    const segmentVector = Matter.Vector.sub(vertexB, vertexA);
    const segmentNormalized = Matter.Vector.normalise(segmentVector);
    const segmentStep = Matter.Vector.mult(segmentNormalized, segmentLength / numSprites);

    for (let j = 0; j < numSprites; j++) {
      const position = Matter.Vector.add(vertexA, Matter.Vector.mult(segmentStep, j + 0.5));

      const sprImg = Bodies.rectangle(position.x, position.y, segmentLength / numSprites, 32, 
      {
        isStatic: true, // l'erba resta ferma per sempre in quel posto
        isSensor: true, // Impostiamo isSensor su true per evitare collisioni fisiche
        angle: Math.atan2(segmentVector.y, segmentVector.x),
        render: {
          sprite: {
            texture: spriteimg,
            xScale: 1,
            yScale: 1,
          },
        },
      });

      Composite.add(engine.world, [sprImg]);
    }
  }
}

function addRandomDirtSprites(numsprites) 
{

  for (let i = 0; i < numsprites; i++) 
  {
    const posX = Math.random() * map.width;
    const posY = Math.random() * map.height;

    const scaleXY = Math.random() * 1.8 + 0.8

    const dirtSprite = Bodies.rectangle(posX, posY, 32, 32, {
      isStatic: true, // la sprite dirt resta ferma per sempre in quel posto
      isSensor: true, // Impostiamo isSensor su true per evitare collisioni fisiche
      render: {
        sprite: {
          texture: internalDirtSprite,
          xScale: scaleXY,
          yScale: scaleXY,
        },
      },
    });

    Composite.add(engine.world, [dirtSprite]);
  }
}

function addRandomRocks(numrocks)
{
  for (let i = 0; i < numrocks; i++) 
  {
    const posX = Math.random() * map.width;
    const posY = Math.random() * map.height;

    const scaleXY = Math.random() * 0.5 + 1

    const rock = Bodies.circle(posX, posY, 16, {
      isStatic: false, 
      isSensor: false, 
      render: {
        sprite: {
          texture: rockSprite,
          xScale: scaleXY,
          yScale: scaleXY,
        },
      },
    });

    Composite.add(engine.world, [rock]);

    // Aggiungi la roccia all'array rocks
    rocks.push(rock); 

  }
}

function addRandomWaterDrops(x,y, timetospawn, timetolive)
{
  setInterval(function() 
  {

    var randomScale = 0.1
    var randomAlpha = 0.7 + Math.random() * 0.3; 
    var randomColor = 
                      Math.random() < 0.2 ? 
                      'rgba(255, 255, 255, ' + randomAlpha + ')' : 
                      'rgba(135, 206, 235, ' + randomAlpha + ')'

    var circle = Bodies.circle(x, y, randomScale * 16, {
      
      render: {
        fillStyle: randomColor,
      },
    });

    Composite.add(engine.world, [circle]);

    setTimeout(function() {
      Composite.remove(engine.world, circle);
    }, timetolive); 

  }, timetospawn);
  
}

function addVine(x, y, rows, col)
{
  var group = Body.nextGroup(true);

  var rope = Composites.stack(x, y, rows, col, 0, 0, function(x, y) 
  {
      return Bodies.rectangle(x, y, 32, 16, {
          collisionFilter: {
              group: group
          },
          render: {
              sprite: {
                  texture: vineSprite
              }
          }
      });
  });
  
  Composites.chain(rope, 0.5, 0, -0.4, 0, {
    render: {
      visible: false
      },
      stiffness: 0.8,
      length: 1
  });
  
  Composite.add(rope, Constraint.create({
    render: {
      visible: false
      },
      bodyB: rope.bodies[0],
      pointB: { x: -16, // distanza tra il primo pezzo e il punto di attacco
                y: 0 },
      pointA: { x: rope.bodies[0].position.x, y: rope.bodies[0].position.y },            
      stiffness: 0.5
  }));
  
  Composite.add(engine.world,[rope]);   

  // Ottieni l'ultimo pezzo di liana
  var lastSegment = rope.bodies[rows * col - 1];

  // aggiungo erba da cui la liana spunta
  var grass = Bodies.rectangle(x+16, y+16+4, 32, 32,  {
    isStatic: true,
    isSensor: true,
    angle: Math.PI,
    render: {
        sprite: {
            texture: grassSprite,
            xScale: 0.6,
            yScale: 1
        }
      }
  });

  // aggiungiamo l'erba al mondo fisico
  Composite.add(engine.world,[grass]);

  return lastSegment;
}

function flipHorizontally(img,x,y)
{
  // move to x + img's width
  ctx.translate(x+img.width,y);

  // scaleX by -1; this "trick" flips horizontally
  ctx.scale(-1,1);
  
  // draw the img
  // no need for x,y since we've already translated
  ctx.drawImage(img,0,0);
  
  // always clean up -- reset transformations to default
  ctx.setTransform(1,0,0,1,0,0);
}

function createParticleThrust(x, y, playerAngle) 
{
  // Calcola l'angolo limite di deviazione
  // 2 gradi di deviazione rispetto all'angolo opposto al player
  const deviationAngle = playerAngle + (Math.PI / 180) * 2; 

  // Genera un angolo casuale tra l'angolo opposto e l'angolo limite
  const angle = Math.random() * (deviationAngle - Math.PI) + Math.PI;

  // Genera una spinta casuale ridotta
  // Valore compreso tra 0.01 e 0.03
  const forceMagnitude = Math.random() * 0.001 
  const force = {
    x: Math.cos(angle) * forceMagnitude,
    y: Math.sin(angle) * forceMagnitude,
  };

  // Genera un colore casuale tra bianco e azzurro
  const color = Math.random() < 0.7 ? 'rgba(255, 255, 255, ' : 
                              Math.random() < 0.8 ? 'rgba(255, 0, 0, ' : 
                              Math.random() < 0.9 ? 'rgba(0, 0, 255, ' : 
                              'rgba(255, 255, 0, ';

  // Trasparenza casuale compresa tra 0.1 e 1
  const alpha = Math.random() * 0.9 + 0.1; 
  const fillColor = color + alpha + ')';

  const radius = Math.random() * 2 + 1;

  // Crea il corpo circolare della particella
  const particle = Bodies.circle(x, y, radius, {
    restitution: 0.1, // Coefficiente di restituzione per il rimbalzo
    frictionAir: 0.05, // Attrito dell'aria
    render: {
      fillStyle: fillColor,
    },
  });

  // Applica la spinta iniziale al corpo della particella
  Body.applyForce(particle, particle.position, force);

  // Aggiungi la particella al mondo di Matter.js
  Composite.add(engine.world, particle);

  // Rimuovi la particella dal mondo dopo 2 secondi
  setTimeout(() => {
    Composite.remove(engine.world, particle);
  }, 50);
}

function isPlayerOnGround() 
{
  const collisions = Matter.Query.collides(player, [polygonFlooring, polygonBase]);
  return collisions.length > 0;
}

function playerCanExit()
{
  if (switch1IsOn)
  {
    // Effettua la query di collisione tra player e uscita
    const collision = Matter.Query.collides(player, [exit]);

    if(collision.length > 0)
    {
      // level complete!
      levelComplete = true
    }
  }
}

function applyGravity(g) 
{ 
  // Applica la forza di gravità al player solo se 
  // non è a contatto con il suolo o altre superfici
  if (!isPlayerOnGround()) {
    Body.applyForce(player, player.position, { x: 0, y: g });
  }
}

// Aggiorna la posizione del nemico
function updateEnemy() {
  // Chiamata alla funzione per aggiornare la posizione del nemico
  updateEnemyPosition(); 

  // Rileva la collisione tra enemy e exit
  const collEnemy = Matter.Query.collides(enemy, [exit]);  

  // Verifica la direzione corrente dell'enemy
  if (enemyDirection === 'right') {
    if (collEnemy.length > 0) {
      // L'enemy sta andando a destra e collide con l'exit
      // Cambia direzione e vai a sinistra
      enemyDirection = 'left';
    }
  } else if (enemyDirection === 'left') {
    if (enemy.position.x < 300) {
      // L'enemy sta andando a sinistra e la sua posizione x è minore di 300
      // Cambia direzione e vai a destra
      enemyDirection = 'right';

      // Rendi l'enemy statico per 5 secondi
      Body.setStatic(enemy, true);
      // Incrementa il numero della riga dello sprite dell'enemy
      enemyRowNumber = enemyHeight      
      setTimeout(() => 
      {
        // Rimuovi la staticità dell'enemy dopo 5 secondi
        Body.setStatic(enemy, false);  
        // Decrementa il numero della riga dello sprite dell'enemy
        enemyRowNumber = 0              
      }, 5000);

    }
  }

  // Richiedi una nuova iterazione del ciclo di aggiornamento
  requestAnimationFrame(updateEnemy);
}

// Funzione per aggiornare la posizione del nemico
function updateEnemyPosition() 
{
  // Verifica la direzione del nemico e applica la forza laterale corrispondente
  if (enemyDirection === 'left') {
    Body.applyForce(enemy, enemy.position, { x: -movementForce, y: 0 });
  } else if (enemyDirection === 'right') {
    Body.applyForce(enemy, enemy.position, { x: movementForce, y: 0 });
  }

  // Limita la velocità laterale  del nemico per evitare
  // che raggiunga una velocità eccessiva
  const maxVelocityX = 5; // Velocità laterale massima consentita
  const velocity = enemy.velocity;
  if (velocity.x > maxVelocityX) {
    Body.setVelocity(enemy, { x: maxVelocityX, y: velocity.y });
  } else if (velocity.x < -maxVelocityX) {
    Body.setVelocity(enemy, { x: -maxVelocityX, y: velocity.y });
  }
}

function distanceBetween(pointA, pointB) 
{
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function angleBetween(pointA, pointB) {
  return Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x);
}

// *** aggiungiamo oggetti vari

// Chiamiamo la funzione per aggiungere le sprite dirt casuali
addRandomDirtSprites(60);

// recupera i vertici del poligono del soffitto
var polygonCeiling = addStaticPolygon(PATHS.ceiling, 500, 40, COLOR_DIRT)

// recupera i vertici del poligono del pavimento
var polygonFlooring = addStaticPolygon(PATHS.flooring, 460, map.height-30, COLOR_GRASS)

// recupera i vertici del poligono della base di partenza
var polygonBase = addStaticPolygon(PATHS.base, centerX, 460, COLOR_GRASS)

// imposta il poligono del muro sinistro
var polyWallL = addStaticPolygon(PATHS.pathrev4, -10, centerY+170, COLOR_DIRT)

// imposta il poligono del muro destro
var polyWallR = addStaticPolygon(PATHS.pathrev3, map.width+50, centerY+180, COLOR_DIRT)

// effetti particellari acqua sinistra
addRandomWaterDrops(10, 100, 15000, 2000); 
addRandomWaterDrops(waterfallX, waterfallY, 100, 1800); //cascata
addRandomWaterDrops(waterfallX+1, waterfallY+4, 300, 1600); //cascata
addRandomWaterDrops(90, 290, 6000, 1300);
addRandomWaterDrops(240, 480, 700, 700);

// effetti particellari acqua destra
addRandomWaterDrops(map.width-45, 100, 10000, 2500);
addRandomWaterDrops(map.width-220, 490, 7000, 800);

// *** aggiungo player, enemy ed elementi con cui interagisce

// definisco il computer di controllo
const steamgeneratorONrect1 = Bodies.rectangle(centerX-18, 350, 4, 9,  
  {
    isStatic: true, 
    isSensor: true, 
    render: {  
      visible: false,  
      fillStyle: "rgba(0, 255, 0, 0.8)"
    }
});
const steamgeneratorONrect2 = Bodies.rectangle(centerX, 350, 3, 10,  
  {
    isStatic: true, 
    isSensor: true, 
    render: {  
      visible: false,  
      fillStyle: "rgba(0, 255, 0, 0.8)"
    }
});
const steamgeneratorONrect3 = Bodies.rectangle(centerX+9, 351, 11, 7,  
  {
    isStatic: true, 
    isSensor: true, 
    render: {  
      visible: false,  
      fillStyle: "rgba(0, 255, 0, 0.8)"
    }
});
const steamgenerator = Bodies.rectangle(centerX, 350, 64, 48,  
{
  isStatic: true, 
  isSensor: true, 
  render: {
       sprite: {
          texture: steamgeneratorSprite
       }
    }
});

// aggiungo il computer al mondo fisico
Composite.add(engine.world,[steamgenerator,
                            steamgeneratorONrect1,
                            steamgeneratorONrect2,
                            steamgeneratorONrect3]);

var flashlightOn = true                            
// definisco il poligono per un effetto switch acceso
const switcONcircle = Bodies.circle(centerX-180, 350, 12, {
  isStatic: true,  
  isSensor: true,    
  render: {  
    visible: false,  
    fillStyle: "rgba(255, 255, 255, 0.5)"
  }
});
// definisco lo switch
const switch1 = Bodies.rectangle(centerX-180, 360, 16, 32,  
  {
    isStatic: true, 
    isSensor: true, 
    render: {
         sprite: {
            texture: switchSprite
         }
      }
});
  
// aggiungo lo switch al mondo fisico
Composite.add(engine.world,[switcONcircle,switch1]);

// definisco uscita dal livello
var exit = Bodies.rectangle(970, 740, 96, 60,  
{
  isStatic: true,
  isSensor: true,
  render: {
    visible: true,
       sprite: {
          texture: exitSprite,
          xScale: 1,
          yScale: 1.2,
       }
    }
});

// aggiungo l'uscita al mondo fisico
Composite.add(engine.world,[exit]);

// definisco il player
var player = Bodies.circle(540, 340, playerWidth*0.4, {
  isStatic: false,  
  friction: 10,
  render: {
    visible: false,
    sprite: {
      texture: '',
      xScale: 1,
      yScale: 1,
    },
  },
});

// aggiungo il player al mondo fisico
Composite.add(engine.world,[player]);

// definisco sprite sheet del player
let playerFrameNumber = 0;

const playerImage = new Image();
playerImage.onload = function() 
{
  function rerender() 
  {
    const offset = (~~playerFrameNumber * playerWidth) % playerImage.width;
    const { x, y } = player.position;

    // Imposto la scala X negativa se il player è orientato verso sinistra
    const xScale = playerDirection === "left" ? -1 : 1

    // Calcolo la coordinata di disegno X tenendo conto
    // della direzione e della larghezza della sprite
    const drawX = playerDirection === "left" ? 
                                          (x + playerWidth / 2) * xScale : 
                                          (x - playerWidth / 2) * xScale
    const drawY = y - playerHeight / 2 - 4

    ctx.save()

      if (flashlightOn && !switch1IsOn)
      {
        // Disegno la maschera circolare intorno al player
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        ctx.beginPath()
        ctx.arc(player.position.x, player.position.y, visionRadius, 0, 2 * Math.PI)
        ctx.rect(0, 0, map.width, map.height)
        ctx.closePath()
        ctx.fill("evenodd")
      }

      // se il player è stato catturato da una liana
      if (gameOver) showGameOver()

      // se ho acceso computer e switch allora posso uscire dal livello
      if (levelComplete) showLevelComplete()      

      // Disegno la sprite del player con la trasformazione
      ctx.scale(xScale, 1)
      ctx.drawImage(
        playerImage,
        offset,
        0,
        playerWidth,
        playerHeight,
        drawX,
        drawY,
        playerWidth,
        playerHeight
      );

    ctx.restore()

    playerFrameNumber += 0.1

    // verifico che il player possa uscire dal livello
    playerCanExit()

    requestAnimationFrame(rerender)
  }

  rerender()
};
playerImage.src = playerSprite

// definisco il nemico
var vertices = Vertices.fromPath(PATHS.enemy)
var enemy = Bodies.fromVertices(260, 650, vertices, {
  isStatic: false,  
  friction: 1,  
  render: {
    visible: false,
    sprite: {
      texture: '',
      xScale: 1,
      yScale: 1,
    },
  },
});  

// aggiungo il nemico al mondo fisico
Composite.add(engine.world,[enemy]);

// definisco sprite sheet del nemico
var enemyFrameNumber = 0;
// definisco la riga corrente dello sprite dell'enemy
var enemyRowNumber = 0
// definisco la velocità di animazione dello sprite sheet
var enemyAnimationSpeed = 0.1

const enemyImage = new Image();
enemyImage.onload = function() 
{
  function rerender() 
  {
    const offset = (~~enemyFrameNumber * enemyWidth) % enemyImage.width;
    const { x, y } = enemy.position;
    
    // Imposta la scala X negativa se il nemico è orientato verso sinistra
    const xScale = enemyDirection === "left" ? -1 : 1;

    // Calcola la coordinata di disegno X tenendo conto della direzione 
    // e della larghezza della sprite
    const drawX = enemyDirection === "left" ? 
                                            (x + enemyWidth / 2) * xScale : 
                                            (x - enemyWidth / 2) * xScale;
    // Calcola la coordinata di disegno Y tenendo conto della riga corrente 
    // e dell'altezza del frame
    const drawY = y - enemyHeight / 2 - 12;

    // Disegna la sprite del nemico con la trasformazione
    ctx.save();
    ctx.scale(xScale, 1);
    ctx.drawImage(
      enemyImage,
      offset,
      enemyRowNumber,
      enemyWidth,
      enemyHeight,
      drawX,
      drawY,
      enemyWidth,
      enemyHeight
    );
    ctx.restore();

    // se enemy è idle allora rallento l'animazione dello sprite sheet
    if (enemyRowNumber === enemyHeight) enemyAnimationSpeed = 0.03
    enemyFrameNumber += enemyAnimationSpeed;

    requestAnimationFrame(rerender);
  }

  rerender();
};
enemyImage.src = enemySprite;

// movimento autonomo del nemico
updateEnemy();

// definisco piattaforma mobile
const platform = Bodies.rectangle(600, 200, 100, 30,  
  {
    isStatic: true, 
    chamfer: 10,
    render: {  
      visible: false,  
      fillStyle: "#FFFF00"
    }
});

// aggiungo piattaforma mobile
Composite.add(engine.world, [platform]);

// muovo la piattaforma
Events.on(engine, 'beforeUpdate', function() 
{
  if (engine.timing.timestamp < 1500) 
  {
      return
  }

  var px = 600 + 100 * Math.sin((engine.timing.timestamp - 1500) * 0.001)

  Body.setPosition(platform, { x: px, y: platform.position.y }, true)
});

// *** aggiungo elementi scenici

// rocce
// Array per memorizzare le rocce presenti nel mondo fisico
var rocks = [];
addRandomRocks(3)

// liana
addVine(400, 98, 5, 1)
addVine(800, 64, 7, 1)

// liana cattiva
var evilVine = addVine(700, 500, 4, 1)
// Cambio la sprite dell'ultimo pezzo di liana in una punta velenosa
evilVine.render.sprite.texture = vineHeadSprite;
// Aggiungo un nuovo corpo circolare rosso sulla punta della liana 
// per quando ha individuato il player
const evilVineHead = Bodies.circle(evilVine.position.x, evilVine.position.y, 16, {
  isStatic: true,
  isSensor: true,
  render: {
    visible: false, // non visibile inizialmente
    fillStyle: 'green',
    opacity: 0.7 // Imposta l'opacità al 50% (trasparente)
  }
});

Composite.add(engine.world, evilVineHead);

// Inizialmente il raggio è 0
let radius = 0; 
function updateEvilVine()
{
  // Calcolo la distanza tra il player e l'ultimo pezzo della liana
  const distance = distanceBetween(player.position, evilVine.position);

  evilVineHead.position = evilVine.position

  if (distance < 80) 
  {
    playerVineConstraint = Constraint.create({
      bodyA: evilVine,
      bodyB: player,
      length: 0, // La lunghezza verrà calcolata dinamicamente
      stiffness: 1 // Stiffness controlla la tensione del constraint
    });
    
    Composite.add(engine.world, [playerVineConstraint])

    evilVineHead.render.fillStyle = 'red'

    // il giocatore ha perso
    gameOver = true
    
    // Aggiorno la lunghezza del constraint tra l'ultimo pezzo e il player
    playerVineConstraint.length = 0.1;
  }
  else if (distance > 80 && distance < 140) 
  {
    evilVineHead.render.visible = true        
  }
  else
  {
    evilVineHead.render.visible = false        
  }
}

// *** aggiungo elementi cosmetici

// impostiamo sprite cosmetiche interne al poligono del soffitto
addInternalCosmeticSprites(polygonCeiling.vertices, 30, dirtSprite, 0, -20)
addInternalCosmeticSprites(polygonCeiling.vertices, 30, internalGrassSprite, 0, -20)

// impostiamo sprite cosmetiche interne al poligono della Base
addInternalCosmeticSprites(polygonBase.vertices, 100, internalGrassSprite)

// impostiamo sprite cosmetiche interne al poligono del pavimento
addInternalCosmeticSprites(polygonFlooring.vertices, 300, internalGrassSprite)

// impostiamo sprite cosmetiche interne al poligono del muro sinistro
addInternalCosmeticSprites(polyWallL.vertices, 80, dirtSprite, -60)
addInternalCosmeticSprites(polyWallL.vertices, 80, internalGrassSprite, -60)

// impostiamo sprite cosmetiche interne al poligono del muri destro
addInternalCosmeticSprites(polyWallR.vertices, 100, dirtSprite, 40)
addInternalCosmeticSprites(polyWallR.vertices, 100, internalGrassSprite, 40)

// *** bordi e muri

// aggiungiamo bordo rocce sul poligono del soffitto 
addCosmeticBorder(polygonCeiling.vertices, internalDirtSprite)

// aggiungiamo bordo di erba sul poligono della Base di partenza
addCosmeticBorder(polygonBase.vertices, grassSprite)

// aggiungiamo bordo di erba sul poligono del pavimento 
addCosmeticBorder(polygonFlooring.vertices, grassSprite)

// *** avvio simulazione del mondo fisico

// Avvia il renderer
Render.run(render)

// Crea il runner
var runner = Runner.create()

// Avvia il motore
Runner.run(runner, engine)

// *** eventi tastiera

// Variabili per memorizzare lo stato degli input da tastiera
var leftPressed = false
var rightPressed = false
var upPressed = false
var downPressed = false
// Variabile per memorizzare la direzione del player
var playerDirection = "right"
var enemyDirection = "right"

// Variabili per l'effetto di tremolio
let shakeInterval
let isShaking = false
var steamGeneratorIsOn = false
var switch1IsOn = false

// Funzione per avviare l'effetto di tremolio
function startShakeEffect() 
{
  // Imposta la durata in millisecondi
  const duration = 500
  // Imposta intensità dell'effetto (pixel di spostamento) 
  const intensity = 4

  // Calcola il tempo di inizio e il tempo di fine dell'effetto
  const startTime = Date.now()
  const endTime = startTime + duration

  // Avvia l'intervallo di aggiornamento per l'effetto di tremolio
  shakeInterval = setInterval(function() {
    const currentTime = Date.now()
    const elapsedTime = currentTime - startTime

    // Calcola l'offset di spostamento casuale per l'effetto di tremolio
    const offsetX = Math.random() * intensity - intensity / 2
    const offsetY = Math.random() * intensity - intensity / 2

    // Applica l'offset di spostamento al canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.translate(offsetX, offsetY)

    // Interrompi l'effetto di tremolio quando raggiungi il tempo di fine
    if (currentTime >= endTime) 
    {
      stopShakeEffect()
    }
  }, 16); // Tempo di aggiornamento dell'effetto in millisecondi
}

// Funzione per interrompere l'effetto di tremolio
function stopShakeEffect() 
{
  clearInterval(shakeInterval);
  // Ripristina la trasformazione del canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0) 
  isShaking = false
  if(!steamGeneratorIsOn)
  {
    // prima volta che entro qui, accendo il computer di controllo
    steamGeneratorIsOn = true
    steamgeneratorONrect1.render.visible = true
    steamgeneratorONrect2.render.visible = true
    steamgeneratorONrect3.render.visible = true
  }
  else
  {
    // seconda volta che entro qui, accendo la luce!
    switch1IsOn = true
    switcONcircle.render.visible = true
    
    // la piattaforma bonus è ora visibile
    platform.render.visible = true
    
    // definisco regalo
    const gift = Bodies.rectangle(platform.position.x, platform.position.y - 16, 
                                  16, 16,  
      {
        render: {  
          visible: false,  
          sprite: {
            texture: giftSprite
          }
        }
    });

    // aggiungo regalo
    Composite.add(engine.world, [gift]);

    // il gift ora è visibile
    gift.render.visible = true
  }
}

function showLevelComplete() 
{
  // Colore del testo
  ctx.fillStyle = '#FFFFFF'
  // Dimensione e tipo di font
  ctx.font = '96px Arial'

  // Posizionamento del testo al centro dello schermo
  const textWidth = ctx.measureText('LEVEL COMPLETE!').width;
  const textX = canvas.width / 2 - textWidth / 2;
  const textY = canvas.height / 2;

  ctx.fillText('LEVEL COMPLETE!', textX, textY);
}

function showGameOver() 
{
  // Colore del testo
  ctx.fillStyle = '#FFFFFF'
  // Dimensione e tipo di font
  ctx.font = '96px Arial'

  // Posizionamento del testo al centro dello schermo
  const textWidth = ctx.measureText('GAME OVER!').width;
  const textX = canvas.width / 2 - textWidth / 2;
  const textY = canvas.height / 2;

  ctx.fillText('GAME OVER!', textX, textY);

  ctx.font = '48px Arial'
  const textActionWidth = ctx.measureText('press F5 to refresh').width;
  const textActionX = canvas.width / 2 - textActionWidth / 2;
  const textActionY = canvas.height / 1.7;

  // Dimensione e tipo di font
  ctx.fillText('press F5 to refresh', textActionX, textActionY);
}

// Aggiungo gli event listener per gli input da tastiera
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Funzione per gestire l'evento keydown
function handleKeyDown(event) 
{

  if (gameOver || levelComplete) return

  // verifico se la liana cattiva mangia il player
  updateEvilVine()

  if (event.key === 'ArrowLeft') 
  {
    leftPressed = true;

    // Verifica se il suono è in riproduzione e se il player è su una base di appoggio
    if (!soundSteps.playing() && isPlayerOnGround()) {
      // Riproduzione del suono solo se non è già in riproduzione
      soundSteps.play();
    }

    // Aggiorna la posizione del player verso sinistra     
    Body.setVelocity(player, { x: -amountMovXPlayer, y: amountMovYPlayer })

    if (!isPlayerOnGround()) 
    {
      applyGravity(0.001)
    }

    // Imposta la direzione del player verso sinistra
    playerDirection = "left"; 
  } 
  else if (event.key === 'ArrowRight') 
  {
    rightPressed = true;

    // Verifica se il suono è in riproduzione e se il player è su una base di appoggio
    if (!soundSteps.playing() && isPlayerOnGround()) {
      // Riproduzione del suono solo se non è già in riproduzione
      soundSteps.play();
    }

    // Aggiorna la posizione del player verso destra    
    Body.setVelocity(player, { x: amountMovXPlayer, y: amountMovYPlayer })

    if (!isPlayerOnGround()) 
    {
      applyGravity(0.001)
    }

    // Imposta la direzione del player verso destra
    playerDirection = "right"; 
  } 
  else if (event.key === 'ArrowUp') 
  {
    upPressed = true;

    // Riproduzione del suono solo se non è già in riproduzione
    soundJump.play();

    // aggiungo effetto esplosione dello zaino razzo
    const playerPosition = player.position;
    const playerVelocity = player.velocity;
    // Calcola l'angolo opposto alla direzione del player
    const playerAngle = Math.atan2(-playerVelocity.y, -playerVelocity.x); 
    for (let i = 0; i < numParticlesJumpPlayer; i++) {
      createParticleThrust(playerPosition.x, playerPosition.y, playerAngle);
    }

    // Imposta la velocità verticale per il salto  
    Body.setVelocity(player, { x: player.velocity.x, y: -amountJumpPlayer }); 
    
    if (leftPressed) {
      // Movimento verso sinistra durante il salto
      // Imposta la velocità orizzontale verso sinistra
      Body.setVelocity(player, { x: -amountMovXPlayer, y: player.velocity.y });       

      if (!isPlayerOnGround())
      {        

        applyGravity(0.001)

        // aggiungo effetto esplosione dello zaino razzo
        const playerPosition = player.position;
        const playerVelocity = player.velocity;
        // Calcola l'angolo opposto alla direzione del player
        const playerAngle = Math.atan2(-playerVelocity.y, -playerVelocity.x); 
        for (let i = 0; i < numParticlesJumpPlayer/3; i++) {
          createParticleThrust(playerPosition.x, playerPosition.y, playerAngle);
        }
      }

    } else if (rightPressed) {
      // Movimento verso destra durante il salto
      // Imposta la velocità orizzontale verso destra
      Body.setVelocity(player, { x: amountMovXPlayer, y: player.velocity.y }); 

      if (!isPlayerOnGround())
      {

        applyGravity(0.001)

        // aggiungo effetto esplosione dello zaino razzo
        const playerPosition = player.position;
        const playerVelocity = player.velocity;
        // Calcola l'angolo opposto alla direzione del player
        const playerAngle = Math.atan2(-playerVelocity.y, -playerVelocity.x); 
        for (let i = 0; i < numParticlesJumpPlayer/3; i++) {
          createParticleThrust(playerPosition.x, playerPosition.y, playerAngle);
        }
      }
    }
  } else if (event.key === 'ArrowDown') {
    downPressed = true;    

    if(!steamGeneratorIsOn)
    {
      // Effettua la query di collisione tra player e steamgenerator
      const collision = Matter.Query.collides(player, [steamgenerator]);

      if(collision.length > 0)
      {
        // Avvia l'effetto di tremolio se non è già attivo
        if (!isShaking) 
        {
          startShakeEffect();
        }
      }
   }
   else
   {
    // Effettua la query di collisione tra player e steamgenerator
    const collision = Matter.Query.collides(player, [switch1]);

    if(!switch1IsOn)
    {
      if(collision.length > 0)
      {
        // Avvia l'effetto di tremolio se non è già attivo
        if (!isShaking) 
        {
          startShakeEffect();
        }
      }  
    }
   }

  } else if (event.key === ' ') {

    // Spazio - spinta del player se in collisione con una roccia o con l'enemy
    const playerVelocity = player.velocity;
    const playerAngle = Math.atan2(-playerVelocity.y, -playerVelocity.x);

    // Verifica la collisione tra il player e le rocce
    const collidingRocks = Matter.Query.collides(player, rocks);

    if (collidingRocks.length > 0) 
    {
      // Applica la forza di spinta alle rocce
      collidingRocks.forEach((collision) => 
      {
        const rock = collision.bodyA === player ? collision.bodyB : collision.bodyA;
        // Magnitudo della forza di spinta
        const forceMagnitude = 0.06; 

        // Calcola la direzione in cui il player sta guardando        
        const forceY = Math.sin(playerAngle) * forceMagnitude;

        // Applica la forza di spinta alla roccia nella direzione opposta a quella del player
        if (playerDirection === 'right') {
          Body.applyForce(rock, rock.position, { x: forceMagnitude, y: forceY });
        } else {
          Body.applyForce(rock, rock.position, { x: -forceMagnitude, y: forceY });
        } 
      });
    }  
  }
}

// Funzione per gestire l'evento keyup
function handleKeyUp(event) 
{
  if (event.key === 'ArrowLeft') {
    leftPressed = false;
  } else if (event.key === 'ArrowRight') {
    rightPressed = false;
  } else if (event.key === 'ArrowUp') {
    upPressed = false;
  } else if (event.key === 'ArrowDown') {
    downPressed = false;
  }
}





