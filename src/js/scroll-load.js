import Bowser from "bowser";
import { aosInit } from "../js/aos.js";
import { tiltInit } from "../js/tilt.jquery.js";
const browser = Bowser.getParser(window.navigator.userAgent);

var topArrow = document.getElementById("top-arrow");
var pageSize = 0;
var movementDown = false;
var movementPos = 150;
var rLoop = false;
var open = false;

function resetScrollLoad() {
  if (open && document.getElementById("top-arrow")) {
    document.getElementById("top-arrow").style.setProperty("margin-top", "0%");
    document
      .getElementById("top-arrow")
      .style.setProperty("transform", "translateY(0%)");
    document.getElementById("works").style.setProperty("display", "block");
    aosInit();
    tiltInit();
  }
}

document.addEventListener("astro:after-swap", resetScrollLoad);

window.onscroll = function(ev) {
  if (document.getElementById("top-arrow")) {
    if (pageSize === 0) {
      pageSize = document.body.offsetHeight;
    } else if (pageSize !== document.body.offsetHeight && !open) {
      window.scrollTo({
        left: 0,
        top: pageSize - window.screenY / 2,
        behavior: "smooth",
      });
      pageSize = document.body.offsetHeight;
      open = true;
    }
    // Per browser behavior
    if (browser.isBrowser("Safari")) {
      if (open) {
        topArrow.style.setProperty("margin-top", "0%");
        topArrow.style.setProperty("transform", "translateY(0%)");
      } else if (
        window.innerHeight + Math.round(window.scrollY) <
        document.body.offsetHeight
      ) {
        topArrow.style.setProperty("margin-top", "-150%");
        topArrow.style.setProperty("transform", "translateY(150%)");
      } else {
        var offset =
          150 -
          5 *
          (window.innerHeight +
            Math.round(window.scrollY) -
            document.body.offsetHeight);
        if (offset < 0) {
          topArrow.style.setProperty("margin-top", "0%");
          topArrow.style.setProperty("transform", "translateY(0%)");
          document
            .getElementById("works")
            .style.setProperty("display", "block");
          aosInit();
          tiltInit();
        } else {
          topArrow.style.setProperty("margin-top", "-" + offset + "%");
          topArrow.style.setProperty(
            "transform",
            "translateY(" + offset + "%)",
          );
        }
      }
    } else {
      if (open) {
        topArrow.style.setProperty("margin-top", "0%");
        topArrow.style.setProperty("transform", "translateY(0%)");
      } else if (
        window.innerHeight + Math.round(window.scrollY) <
        document.body.offsetHeight
      ) {
        movementDown = false;
      } else {
        if (!rLoop) {
          arrowMovement();
        }
        movementDown = true;
      }
    }
  }
};

async function timeout(ms) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

async function arrowMovement() {
  while (true) {
    if (movementDown) {
      if (movementPos === 0) {
        document.getElementById("works").style.setProperty("display", "block");
        aosInit();
        tiltInit();
        window.scrollTo(0, pageSize - window.screenY / 2);
        open = true;
        break;
      } else {
        movementPos -= 3;
        topArrow.style.setProperty("margin-top", "-" + movementPos + "%");
        topArrow.style.setProperty(
          "transform",
          "translateY(" + movementPos + "%)",
        );
      }
    } else {
      if (movementPos < 150) {
        movementPos += 6;
        topArrow.style.setProperty("margin-top", "-" + movementPos + "%");
        topArrow.style.setProperty(
          "transform",
          "translateY(" + movementPos + "%)",
        );
      }
    }
    await timeout(50);
  }
}

document
  .getElementById("portfolio-link")
  .addEventListener("click", function() {
    document.getElementById("works").style.setProperty("display", "block");
    aosInit();
    tiltInit();
    window.scrollTo(0, pageSize - window.screenY / 2);
    open = true;
  });

document
  .getElementById("portfolio-arrows")
  .addEventListener("click", function() {
    document.getElementById("works").style.setProperty("display", "block");
    aosInit();
    tiltInit();
    window.scrollTo(0, pageSize - window.screenY / 2);
    open = true;
  });
