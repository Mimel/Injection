(($) ->
  nodeStarter = '@'
  fieldStarter = '#'
  storeChar = '$'
  nullChar = '~'
  # '$' refers to the store value; '~' refers to NULL.
  valueStarter = [fieldStarter, storeChar, nullChar]

  # List of node types.
  compTypes = ['console', 'server']

  # This represents a virtual node in the Inject.ion network.
  class Node
    constructor: (@name, @type, @fields, @linksTo) ->

    followPath: (path) ->
      currentNode = this
      if path.length != 0
        currentNode = @linksTo[path[0]]
        currentNode.followPath(path.slice(1))
      return currentNode

  # This is the network of the current level. This can change.
  network = new Node 'valkyrie', 'console', {
    cache: 0
    mem: 35
  },
  {
    arbiter: new Node 'arbiter', 'server', {
      secret: 42
      double: 32
    },
    {
      erinyes: new Node 'erinyes', 'server', {
        secret: 42
        double: 32
      }, {

      }
      cyclops: new Node 'cyclops', 'server', {
        pass: 4042
      }, {

      }
    }
    charybdis: new Node 'charybdis', 'server', {
      test: 20
    }, {

    }
  }

  # Contains every single Inject.ion command.
  commandDictionary =
    # Goes to the following node, carrying a value.
    # Expects 2 parameters, a node, and a value.
    inject: (values, env) ->
      node = values[0]
      value = values[1]
      # '$' and '~' will do nothing.
      if node.charAt(0) == nodeStarter and valueStarter.includes(value.charAt(0))
        if value.charAt(0) == fieldStarter
          env.store = env.tree.followPath(env.path).fields[value.substring(1)]
        env.path.push(node.substring(1))

      console.log(JSON.stringify(env))
      return env

    # Returns to the node's parrent, carrying the value of the field indicated and setting it into store.
    # Expects 1 parameter, a value.
    return: (values, env) ->
      field = values[0]
      if field.charAt(0) == fieldStarter
        env.store = env.tree.followPath(env.path).fields[field.substring(1)]
        env.path = env.path.slice(0, env.path.length - 1)

      console.log(JSON.stringify(env))
      return env

    # Sets a field in the node to the value indicated.
    # Expects 2 parameters, a field and a value.
    set: (values, env) ->
      field = values[0]
      value = values[1]

      if field.charAt(0) == fieldStarter and valueStarter.includes(value.charAt(0))
        actualValue = 0
        if value.charAt(0) == storeChar
          actualValue = env.store
        else if value.charAt(0) == fieldStarter
          actualValue = env.tree.followPath(env.path).fields[value.substring(1)]
        env.tree.followPath(env.path).fields[field.substring(1)] = actualValue

      console.log(JSON.stringify(env))
      return env

  # Forgive me, codemasters, but I need to insert the view into this model class, just this once.

  canvas = document.getElementById('env_view')
  ctxt = canvas.getContext('2d')

  # Load assets.
  consoleImg = new Image()
  consoleImg.onload = ->
    redraw(network, 50, 50)
  consoleImg.src = 'img/terminal.png'
  serverImg = new Image()
  serverImg.src = 'img/cloud-server.png'

  # Distance in pixels between a node and its children.
  nodeChildrenDistance = 300
  # End asset loading.

  # Renders a view of the network.
  # node: the network node to draw.
  # x: the x-location to draw the node at.
  # y: the y-location to draw the node at.
  # s_range: the start of the angle range this node can draw its children on.
  # e_range: the end of the angle range this node can draw its children on.
  renderView = (node, x, y, s_range, e_range) ->
    console.log(node)
    if node.type == compTypes[0]
      ctxt.drawImage(consoleImg, x, y, 100, 100)
    else if node.type == compTypes[1]
      ctxt.drawImage(serverImg, x, y, 100, 100)
    ctxt.font = '20px Fira Code'
    ctxt.fillText('@' + node.name, x, y + 100 + 20, 200)

    ctxt.font = '15px Fira Code'
    offset = 135
    for field of node.fields
      if node.fields.hasOwnProperty(field)
        ctxt.fillText('#' + field + ' → ' + node.fields[field], x + 5, y + offset, 200)
        offset += 15

    if Object.keys(node.linksTo).length > 0
      numChildren = Object.keys(node.linksTo).length
      currentChild = 1
      for child of node.linksTo
        if node.linksTo.hasOwnProperty(child)
          drawAngle = ((e_range - s_range) / (numChildren + 1)) * currentChild * 0.01745329
          new_s_range = s_range + ((e_range - s_range) / numChildren) * (currentChild - 1)
          new_e_range = new_s_range + ((e_range - s_range) / numChildren)
          end_x = x + nodeChildrenDistance * Math.cos(drawAngle)
          end_y = y + nodeChildrenDistance * Math.sin(drawAngle)

          ctxt.beginPath()
          ctxt.moveTo(x + 50, y + 50)
          ctxt.lineTo(end_x + 50, end_y + 50)
          ctxt.lineWidth = 5
          ctxt.strokeStyle = 'rgba(100, 100, 100, 0.3)'
          ctxt.stroke()

          renderView(node.linksTo[child], end_x, end_y, new_s_range, new_e_range)
          currentChild += 1

  redraw = (node, x, y) ->
    ctxt.clearRect(0, 0, canvas.width, canvas.height)
    renderView(node, x, y, 0, 90)

  # Adjust canvas bounds on resize, and redraw contents.
  window.addEventListener 'resize', (event) ->
    ctxt.canvas.width = window.innerWidth - 300
    ctxt.canvas.height = window.innerHeight
    redraw(network, 50, 50)

  # Set canvas bounds.
  ctxt.canvas.width = window.innerWidth - 300
  ctxt.canvas.height = window.innerHeight

  # End View, resume Model.

  # This creates a rudimentary environment for the Inject.ion code.
  class InjectionRunner
    env = {
      store: 0
      line: 0
      path: []
      tree: null
    }

    constructor: (@code) ->

    run: (tree) ->
      env.tree = tree
      splitLines = @code.split('\n')
      runLine(splitLines[env.line++]) while env.line < splitLines.length

    runLine = (line) ->
      lexemes = line.split(' ')
      env = commandDictionary[lexemes[0]](lexemes.slice(1), env)
      redraw(env.tree, 50, 50)

  $('#injection_run').click (event) ->
    event.preventDefault()
    runner = new InjectionRunner $('#injection_code').val()
    runner.run(network)
) jQuery
