window.requestAnimationFrame =
  window.__requestAnimationFrame ||
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  (function () {
    return function (callback, element) {
      var lastTime = element.__lastTime || 0;
      var currTime = Date.now();
      var timeToCall = Math.max(1, 33 - (currTime - lastTime));
      window.setTimeout(callback, timeToCall);
      element.__lastTime = currTime + timeToCall;
    };
  })();

window.isDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
  (navigator.userAgent || navigator.vendor || window.opera).toLowerCase()
);

var loaded = false;

function init() {
  if (loaded) return;
  loaded = true;

  var mobile = window.isDevice;
  var koef = mobile ? 0.5 : 1;
  var canvas = document.getElementById("heart");
  var ctx = canvas.getContext("2d");
  var width = (canvas.width = koef * innerWidth);
  var height = (canvas.height = koef * innerHeight);
  var rand = Math.random;

  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, width, height);

  // Функція для генерації точок зірки (5-променева)
  function starPosition(rad) {
    const outerRadius = 1.0;
    const innerRadius = 0.5;
    const angle = Math.PI / 5; // 36 градусів у радіанах

    let x, y;
    if (rad % (2 * angle) < angle) {
      // Зовнішня точка
      x = outerRadius * Math.sin(rad);
      y = -outerRadius * Math.cos(rad);
    } else {
      // Внутрішня точка
      x = innerRadius * Math.sin(rad + angle);
      y = -innerRadius * Math.cos(rad + angle);
    }
    return [x, y];
  }

  function scaleAndTranslate(pos, sx, sy, dx, dy) {
    return [dx + pos[0] * sx, dy + pos[1] * sy];
  }

  window.addEventListener("resize", function () {
    width = canvas.width = koef * innerWidth;
    height = canvas.height = koef * innerHeight;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);
  });

  var traceCount = mobile ? 10 : 50;
  var pointsOrigin = [];
  var dr = mobile ? 0.1 : 0.05;

  // Генеруємо точки для зірки
  for (var i = 0; i < Math.PI * 2; i += dr) {
    pointsOrigin.push(scaleAndTranslate(starPosition(i), 200 * koef, 200 * koef, 0, 0));
  }

  var starPointsCount = pointsOrigin.length;
  var targetPoints = [];

  function pulse(kx, ky) {
    for (var i = 0; i < pointsOrigin.length; i++) {
      targetPoints[i] = [
        kx * pointsOrigin[i][0] + width / 2,
        ky * pointsOrigin[i][1] + height / 2,
      ];
    }
  }

  var e = [];
  for (var i = 0; i < starPointsCount; i++) {
    var x = rand() * width;
    var y = rand() * height;
    e[i] = {
      vx: 0,
      vy: 0,
      R: 2,
      speed: rand() + 5,
      q: ~~(rand() * starPointsCount),
      D: 2 * (i % 2) - 1,
      force: 0.2 * rand() + 0.7,
      f: "rgba(255, 215, 0, 0.7)", // Золотий колір для зірки
      trace: Array.from({ length: traceCount }, () => ({ x, y })),
    };
  }

  var config = { traceK: 0.4, timeDelta: 0.6 };
  var time = 0;

  function loop() {
    var n = -Math.cos(time);
    pulse((1 + n) * 0.5, (1 + n) * 0.5);
    time += (Math.sin(time) < 0 ? 9 : n > 0.8 ? 0.2 : 1) * config.timeDelta;

    ctx.fillStyle = "rgba(0,0,0,.1)";
    ctx.fillRect(0, 0, width, height);

    for (var i = e.length; i--;) {
      var u = e[i];
      var q = targetPoints[u.q];
      var dx = u.trace[0].x - q[0];
      var dy = u.trace[0].y - q[1];
      var length = Math.sqrt(dx * dx + dy * dy);

      if (length < 10) {
        if (rand() > 0.95) {
          u.q = ~~(rand() * starPointsCount);
        } else {
          if (rand() > 0.99) u.D *= -1;
          u.q = (u.q + u.D) % starPointsCount;
          if (u.q < 0) u.q += starPointsCount;
        }
      }

      u.vx += (-dx / length) * u.speed;
      u.vy += (-dy / length) * u.speed;
      u.trace[0].x += u.vx;
      u.trace[0].y += u.vy;
      u.vx *= u.force;
      u.vy *= u.force;

      for (var k = 0; k < u.trace.length - 1; k++) {
        var T = u.trace[k];
        var N = u.trace[k + 1];
        N.x -= config.traceK * (N.x - T.x);
        N.y -= config.traceK * (N.y - T.y);
      }

      ctx.fillStyle = u.f;
      u.trace.forEach((t) => ctx.fillRect(t.x, t.y, 1, 1));
    }

    window.requestAnimationFrame(loop, canvas);
  }

  loop();
}

// Залишаємо музику без змін
function continueMusic() {
  const music = document.getElementById("backgroundMusic");
  const isMusicPlaying = localStorage.getItem("musicPlaying") === "true";
  const musicCurrentTime = localStorage.getItem("musicCurrentTime") || 0;

  if (music) {
    if (isMusicPlaying) {
      music.currentTime = parseFloat(musicCurrentTime);
      music.play().catch((error) => console.log("Music playback failed", error));
    }
  }

  document.addEventListener("click", function startMusic() {
    if (music && !isMusicPlaying) {
      music.play().catch((error) => console.log("Autoplay prevented", error));
      localStorage.setItem("musicPlaying", "true");
      document.removeEventListener("click", startMusic);
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  init();
  continueMusic();
});