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
    redraw(network, 100, 50)
  consoleImg.src = 'img/terminal.png'
  serverImg = new Image()
  serverImg.src = 'img/cloud-server.png'

  # End asset loading.
  renderView = (node, x, y) ->
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
      for child of node.linksTo
        if node.linksTo.hasOwnProperty(child)
          renderView(node.linksTo[child], x, y + 300)

  redraw = (node, x, y) ->
    ctxt.clearRect(0, 0, canvas.width, canvas.height)
    renderView(node, x, y)

  # Adjust canvas bounds on resize, and redraw contents.
  window.addEventListener 'resize', (event) ->
    ctxt.canvas.width = window.innerWidth - 300
    ctxt.canvas.height = window.innerHeight
    redraw(network, 100, 50)

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
      redraw(env.tree, 100, 50)

  $('#injection_run').click (event) ->
    event.preventDefault()
    runner = new InjectionRunner $('#injection_code').val()
    runner.run(network)
) jQuery
