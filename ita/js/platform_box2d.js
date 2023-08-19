// Definisci le dimensioni della mappa
const map = {
    width: 1000,
    height: 1000
};

// Ottieni il riferimento al canvas
var canvas = document.getElementById("platform_canvas");
canvas.width = map.width;
canvas.height = map.height;

// Creazione del mondo di gioco con BOX2D.js

// Inizializzazione delle variabili
var b2Vec2 = Box2D.Common.Math.b2Vec2,
    b2BodyDef = Box2D.Dynamics.b2BodyDef,
    b2Body = Box2D.Dynamics.b2Body,
    b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
    b2World = Box2D.Dynamics.b2World,
    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
    b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;

// Creazione del mondo fisico
var world = new b2World(
   new b2Vec2(0, 10)    // gravità
   ,  true              // permette ai corpi inattivi di dormire
);

// Definizione del terreno
var bodyDef = new b2BodyDef;
// questo corpo non si muoverà
bodyDef.type = b2Body.b2_staticBody; 
bodyDef.position.x = 0;
bodyDef.position.y = 0;

var fixDef = new b2FixtureDef;
fixDef.shape = new b2PolygonShape;
// dimensioni del rettangolo
fixDef.shape.SetAsBox(20, 2); 

// aggiungiamo il terreno al mondo
world.CreateBody(bodyDef).CreateFixture(fixDef); 


