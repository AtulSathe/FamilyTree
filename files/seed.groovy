// FamilyTree — Gremlin seed script
// Runs automatically on gremlin-server startup via gremlin-server.yaml
// Person IDs match exactly the GUIDs in DataSeeder.cs

def g = traversal().withEmbedded(graph)

// ── Clear existing data ────────────────────────────────────────────────────
g.V().drop().iterate()

// ── Helper closure ─────────────────────────────────────────────────────────
def addPerson = { id, name, surname, treeId ->
    g.addV('person')
     .property('personId', id)
     .property('fullName', name)
     .property('surname', surname)
     .property('familyTreeId', treeId)
     .next()
}

// ── Sathe tree ID ──────────────────────────────────────────────────────────
def satheTreeId  = '10000000-0000-0000-0000-000000000001'
def panseTreeId  = '10000000-0000-0000-0000-000000000002'

// ── Sathe persons ──────────────────────────────────────────────────────────
def v_vishnupant   = addPerson('20000000-0000-0000-0000-000000000001', 'Vishnupant Sathe',  'Sathe', satheTreeId)
def v_lakshmibai   = addPerson('20000000-0000-0000-0000-000000000002', 'Lakshmibai Sathe',  'Sathe', satheTreeId)
def v_ramchandra   = addPerson('20000000-0000-0000-0000-000000000003', 'Ramchandra Sathe',  'Sathe', satheTreeId)
def v_sumitra      = addPerson('20000000-0000-0000-0000-000000000004', 'Sumitra Sathe',     'Sathe', satheTreeId)
def v_suresh       = addPerson('20000000-0000-0000-0000-000000000005', 'Suresh Sathe',      'Sathe', satheTreeId)
def v_meena        = addPerson('20000000-0000-0000-0000-000000000006', 'Meena Sathe',       'Panse', satheTreeId) // born Panse
def v_anand        = addPerson('20000000-0000-0000-0000-000000000007', 'Anand Sathe',       'Sathe', satheTreeId)
def v_rahul        = addPerson('20000000-0000-0000-0000-000000000008', 'Rahul Sathe',       'Sathe', satheTreeId)
def v_priya        = addPerson('20000000-0000-0000-0000-000000000009', 'Priya Sathe',       'Sathe', satheTreeId)

// ── Panse persons ──────────────────────────────────────────────────────────
def v_dattatraya   = addPerson('20000000-0000-0000-0000-000000000010', 'Dattatraya Panse',  'Panse', panseTreeId)
def v_saraswati    = addPerson('20000000-0000-0000-0000-000000000011', 'Saraswati Panse',   'Panse', panseTreeId)
def v_govind       = addPerson('20000000-0000-0000-0000-000000000012', 'Govind Panse',      'Panse', panseTreeId)
def v_shanta       = addPerson('20000000-0000-0000-0000-000000000013', 'Shanta Panse',      'Panse', panseTreeId)
def v_madhav       = addPerson('20000000-0000-0000-0000-000000000014', 'Madhav Panse',      'Panse', panseTreeId)
def v_vijaya       = addPerson('20000000-0000-0000-0000-000000000015', 'Vijaya Panse',      'Panse', panseTreeId)
def v_arun         = addPerson('20000000-0000-0000-0000-000000000016', 'Arun Panse',        'Panse', panseTreeId)
def v_snehal       = addPerson('20000000-0000-0000-0000-000000000017', 'Snehal Panse',      'Panse', panseTreeId)

// ── Sathe relationships ────────────────────────────────────────────────────
// Gen 1 marriage
g.addE('spouse').from(v_vishnupant).to(v_lakshmibai).iterate()
g.addE('spouse').from(v_lakshmibai).to(v_vishnupant).iterate()

// Gen 1 -> Gen 2
g.addE('parent_of').from(v_vishnupant).to(v_ramchandra).iterate()
g.addE('child_of').from(v_ramchandra).to(v_vishnupant).iterate()
g.addE('parent_of').from(v_lakshmibai).to(v_ramchandra).iterate()
g.addE('child_of').from(v_ramchandra).to(v_lakshmibai).iterate()

// Gen 2 marriage
g.addE('spouse').from(v_ramchandra).to(v_sumitra).iterate()
g.addE('spouse').from(v_sumitra).to(v_ramchandra).iterate()

// Gen 2 -> Gen 3
g.addE('parent_of').from(v_ramchandra).to(v_suresh).iterate()
g.addE('child_of').from(v_suresh).to(v_ramchandra).iterate()
g.addE('parent_of').from(v_sumitra).to(v_suresh).iterate()
g.addE('child_of').from(v_suresh).to(v_sumitra).iterate()
g.addE('parent_of').from(v_ramchandra).to(v_anand).iterate()
g.addE('child_of').from(v_anand).to(v_ramchandra).iterate()
g.addE('parent_of').from(v_sumitra).to(v_anand).iterate()
g.addE('child_of').from(v_anand).to(v_sumitra).iterate()

// Sibling
g.addE('sibling_of').from(v_suresh).to(v_anand).iterate()
g.addE('sibling_of').from(v_anand).to(v_suresh).iterate()

// Gen 3 marriage — CROSS-TREE LINK
g.addE('spouse').from(v_suresh).to(v_meena).iterate()
g.addE('spouse').from(v_meena).to(v_suresh).iterate()

// Gen 3 -> Gen 4
g.addE('parent_of').from(v_suresh).to(v_rahul).iterate()
g.addE('child_of').from(v_rahul).to(v_suresh).iterate()
g.addE('parent_of').from(v_meena).to(v_rahul).iterate()
g.addE('child_of').from(v_rahul).to(v_meena).iterate()
g.addE('parent_of').from(v_suresh).to(v_priya).iterate()
g.addE('child_of').from(v_priya).to(v_suresh).iterate()
g.addE('parent_of').from(v_meena).to(v_priya).iterate()
g.addE('child_of').from(v_priya).to(v_meena).iterate()

// Sibling Gen 4
g.addE('sibling_of').from(v_rahul).to(v_priya).iterate()
g.addE('sibling_of').from(v_priya).to(v_rahul).iterate()

// ── Panse relationships ────────────────────────────────────────────────────
g.addE('spouse').from(v_dattatraya).to(v_saraswati).iterate()
g.addE('spouse').from(v_saraswati).to(v_dattatraya).iterate()

g.addE('parent_of').from(v_dattatraya).to(v_govind).iterate()
g.addE('child_of').from(v_govind).to(v_dattatraya).iterate()
g.addE('parent_of').from(v_saraswati).to(v_govind).iterate()
g.addE('child_of').from(v_govind).to(v_saraswati).iterate()
g.addE('parent_of').from(v_dattatraya).to(v_madhav).iterate()
g.addE('child_of').from(v_madhav).to(v_dattatraya).iterate()
g.addE('parent_of').from(v_saraswati).to(v_madhav).iterate()
g.addE('child_of').from(v_madhav).to(v_saraswati).iterate()

g.addE('sibling_of').from(v_govind).to(v_madhav).iterate()
g.addE('sibling_of').from(v_madhav).to(v_govind).iterate()

g.addE('spouse').from(v_govind).to(v_shanta).iterate()
g.addE('spouse').from(v_shanta).to(v_govind).iterate()

g.addE('spouse').from(v_madhav).to(v_vijaya).iterate()
g.addE('spouse').from(v_vijaya).to(v_madhav).iterate()

// Meena is daughter of Madhav (cross-tree person node lives in Sathe tree)
// We store this as an in_law edge from madhav to meena's vertex ID
g.addE('parent_of').from(v_madhav).to(v_meena).iterate()
g.addE('child_of').from(v_meena).to(v_madhav).iterate()

g.addE('parent_of').from(v_madhav).to(v_arun).iterate()
g.addE('child_of').from(v_arun).to(v_madhav).iterate()
g.addE('parent_of').from(v_vijaya).to(v_arun).iterate()
g.addE('child_of').from(v_arun).to(v_vijaya).iterate()

g.addE('sibling_of').from(v_meena).to(v_arun).iterate()
g.addE('sibling_of').from(v_arun).to(v_meena).iterate()

g.addE('parent_of').from(v_arun).to(v_snehal).iterate()
g.addE('child_of').from(v_snehal).to(v_arun).iterate()

println "Seed complete: ${g.V().count().next()} vertices, ${g.E().count().next()} edges"
