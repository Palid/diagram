import { EventListenerFunctionProps, Action, GraphState } from './types';

let isMouseOver = false;

let mouseDown = {
  down: false,
  x: 0,
  y: 0
};

export const addEventListeners = ({
  stateUpdate,
  deleteNodes,
  whereToRun,
  copyNode,
  undo,
  redo,
  snapshot,
  autoPosition,
  scale,
  validate,
  pan,
  drawConnectors,
  moveNodes
}: EventListenerFunctionProps) => {
  const eventContainer = document;
  whereToRun.oncontextmenu = () => {
    return false;
  };
  whereToRun.addEventListener('wheel', (e) => {
    // Scrolling on e.g. Firefox uses line count as delta, not pixels
    const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
    scale(delta, e.clientX, e.clientY);
  });
  whereToRun.addEventListener('mouseover', (e) => {
    isMouseOver = true;
  });
  whereToRun.addEventListener('mouseleave', (e) => {
    isMouseOver = false;
  });
  eventContainer.addEventListener('keydown', (e) => {
    if (!isMouseOver) {
      return;
    }
    const key = e.charCode || e.keyCode || e.key;
    const ctrlDown = e.ctrlKey || e.metaKey || e.key === 'Meta' || e.key === 'Ctrl';
    const altDown = e.altKey;
    if (key === 8) {
      if ((e.target as any).type !== 'text') {
        e.preventDefault();
      }
    }
    if (altDown) {
      stateUpdate((state) => {
        if (!state.altPressed) {
          return {
            altPressed: true
          };
        }
        return {};
      });
      if(key === 86){
        validate()
      }
    }
    if (ctrlDown) {
      stateUpdate((state) => {
        if (!state.ctrlPressed) {
          return {
            ctrlPressed: true
          };
        }
        return {};
      });
      if (key === 68) {
        e.preventDefault();
        copyNode();
      }
      if (key === 70) {
        e.preventDefault();
        stateUpdate((state) => {
          return {
            searchMenuActive: !state.searchMenuActive
          } as Partial<typeof state>;
        });
      }
      if (key === 76) {
        e.preventDefault();
        autoPosition();
      }
      if (key === 90) {
        e.preventDefault();
        undo();
      }
      if (key === 89) {
        e.preventDefault();
        redo();
      }
    }
    if (key === 46) {
      stateUpdate((state) => {
        if (state.activeNodes.length === 0) {
          return {};
        }
        const stateUpdate = {
          ...deleteNodes(),
          selected: [],
          renamed: null
        };
        return stateUpdate;
      });
    }
    if (key === 32) {
      stateUpdate((state) => {
        if (!state.spacePressed) {
          return {
            spacePressed: true,
            spaceX: state.mouseX,
            spaceY: state.mouseY
          };
        }
        return {};
      });
    }
  });
  eventContainer.addEventListener('keyup', (e) => {
    const ctrlDown =
      e.ctrlKey ||
      e.metaKey ||
      e.key === 'Meta' ||
      e.key === 'Ctrl' ||
      e.keyCode === 224 ||
      e.keyCode === 17;
    const altDown = e.altKey || e.key === 'Alt' || e.keyCode === 18;
    if (e.keyCode === 32) {
      stateUpdate((state) => {
        return {
          spacePressed: false
        };
      });
    }
    if (altDown) {
      stateUpdate((state) => {
        return {
          altPressed: false
        };
      });
    }
    if (ctrlDown) {
      stateUpdate((state) => {
        return {
          ctrlPressed: false
        };
      });
    }
  });
  eventContainer.addEventListener('mouseup', (e) => {
    mouseDown = {
      ...mouseDown,
      down: false
    };
  });
  eventContainer.addEventListener('mousedown', (e) => {
    mouseDown = {
      x: e.clientX,
      y: e.clientY,
      down: true
    };
  });
  eventContainer.addEventListener('mousemove', (e) => {
    stateUpdate((state) => {
      let stateUpdate: Partial<GraphState> = {
        mouseX: e.clientX,
        mouseY: e.clientY
      };
      let m = {
        x: e.clientX - mouseDown.x,
        y: e.clientY - mouseDown.y
      };
      mouseDown = {
        x: e.clientX,
        y: e.clientY,
        down: mouseDown.down
      };
      if (state.action === Action.SelectedNode && (m.x || m.y)) {
        stateUpdate.action = Action.MoveNode;
        snapshot('past', 'future');
      }
      if (
        mouseDown.down &&
        (state.action === Action.MoveNode || stateUpdate.action === Action.MoveNode)
      ) {
        moveNodes(m.x, m.y);
      }
      if (state.action === Action.ConnectPort) {
        drawConnectors(e.clientX, e.clientY);
      }
      if (state.action === Action.Pan) {
        pan(m.x, m.y);
      }
      return stateUpdate;
    });
  });
};
